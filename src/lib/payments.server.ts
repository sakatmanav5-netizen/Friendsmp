import { createHmac, timingSafeEqual } from "crypto";

export type RazorpayConfig = { keyId: string; keySecret: string; webhookSecret?: string; currency?: string };

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export async function getRazorpay(db: Admin): Promise<RazorpayConfig | null> {
  const { data } = await db.from("site_settings").select("value").eq("key", "razorpay").maybeSingle();
  const v = data?.value as RazorpayConfig | null;
  return v?.keyId && v?.keySecret ? v : null;
}

export function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function hmac(secret: string, body: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/** Marks a pending order paid and queues its in-game grant commands (idempotent). */
export async function payAndQueue(db: Admin, orderId: string, paymentRef: string) {
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.status !== "pending") return false;

  const { data: updated } = await db
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), payment_ref: paymentRef })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id");
  if (!updated?.length) return false;

  const { data: product } = await db
    .from("products")
    .select("rcon_commands")
    .eq("id", order.product_id)
    .maybeSingle();
  const commands = (product?.rcon_commands as string[] | null) ?? [];
  if (commands.length) {
    await db.from("delivery_jobs").insert(
      commands.map((command) => ({
        order_id: order.id,
        minecraft_username: order.minecraft_username,
        command: command.replaceAll("{username}", order.minecraft_username),
        kind: "grant",
      })),
    );
  }
  await db.from("admin_audit").insert({
    actor_id: null as never,
    actor_email: "razorpay",
    action: "order.auto_paid",
    target: order.reference,
    details: { paymentRef, commands: commands.length } as never,
  });
  return true;
}
