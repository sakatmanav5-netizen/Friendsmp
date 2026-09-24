import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Staff = { role: "owner" | "editor"; userId: string; email: string | null };

/** Confirms the caller is staff and returns their role. Throws otherwise. */
async function requireStaff(context: {
  supabase: { from: (t: string) => any };
  userId: string;
  claims: Record<string, unknown>;
}): Promise<Staff> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);

  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.length) throw new Error("Forbidden");

  return {
    role: roles.includes("owner") ? "owner" : "editor",
    userId: context.userId,
    email: (context.claims["email"] as string | undefined) ?? null,
  };
}

async function audit(actor: Staff, action: string, target: string, details: unknown = {}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit").insert({
    actor_id: actor.userId,
    actor_email: actor.email,
    action,
    target,
    details: details as never,
  });
}

/** Who am I, and what can I do? */
export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role as "owner" | "editor");
    return {
      userId: context.userId,
      email: (context.claims["email"] as string | undefined) ?? null,
      roles,
      isOwner: roles.includes("owner"),
      isStaff: roles.length > 0,
    };
  });

/** Dashboard payload: ledger, delivery queue, catalog, content, staff, bridge key. */
export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [orders, jobs, products, settings, roles, profiles, auditRows] = await Promise.all([
      supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin
        .from("delivery_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin.from("products").select("*").order("sort_order", { ascending: true }),
      supabaseAdmin.from("site_settings").select("key, value"),
      supabaseAdmin.from("user_roles").select("user_id, role, granted_at"),
      supabaseAdmin.from("profiles").select("id, email, display_name"),
      supabaseAdmin
        .from("admin_audit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const settingsMap = Object.fromEntries((settings.data ?? []).map((s) => [s.key, s.value]));
    const profileMap = new Map((profiles.data ?? []).map((p) => [p.id, p]));

    return {
      me: staff,
      orders: orders.data ?? [],
      jobs: jobs.data ?? [],
      products: products.data ?? [],
      content: (settingsMap["content"] ?? {}) as Record<string, unknown>,
      bridgeToken: staff.role === "owner" ? ((settingsMap["bridge"] as any)?.token ?? null) : null,
      staff: (roles.data ?? []).map((r) => ({
        userId: r.user_id,
        role: r.role,
        grantedAt: r.granted_at,
        email: profileMap.get(r.user_id)?.email ?? null,
        name: profileMap.get(r.user_id)?.display_name ?? null,
      })),
      audit: auditRows.data ?? [],
    };
  });

/** Save the website content edited in the visual editor. */
export const saveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { content: Record<string, unknown> }) => data)
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({
        key: "content",
        value: data.content as never,
        updated_at: new Date().toISOString(),
        updated_by: staff.userId,
      })
      .eq("key", "content");
    if (error) throw new Error(error.message);
    await audit(staff, "content.save", "site_settings/content");
    return { ok: true };
  });

const productInput = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(60),
  price: z.number().min(0).max(100000),
  blurb: z.string().max(400),
  perks: z.array(z.string().max(120)).max(12),
  rcon_commands: z.array(z.string().max(200)).max(12),
  revoke_commands: z.array(z.string().max(200)).max(12),
  featured: z.boolean(),
  active: z.boolean(),
});

/** Update a store package, including the commands run in-game on delivery. */
export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => productInput.parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({
        name: data.name,
        price: data.price,
        blurb: data.blurb,
        perks: data.perks as never,
        rcon_commands: data.rcon_commands as never,
        revoke_commands: data.revoke_commands as never,
        featured: data.featured,
        active: data.active,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(staff, "product.save", data.id, { price: data.price });
    return { ok: true };
  });

const orderAction = z.object({
  orderId: z.string().uuid(),
  username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{3,16}$/)
    .optional(),
  reason: z.string().trim().max(300).optional(),
  paymentRef: z.string().trim().max(120).optional(),
});

/** Mark an order paid and queue the in-game delivery commands. */
export const markPaidAndDeliver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => orderAction.parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (error) throw new Error(error.message);
    if (order.status === "refunded") throw new Error("This order was refunded.");

    const username = data.username ?? order.minecraft_username;
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("rcon_commands")
      .eq("id", order.product_id)
      .maybeSingle();

    const commands = (product?.rcon_commands as string[] | null) ?? [];
    if (commands.length) {
      await supabaseAdmin.from("delivery_jobs").insert(
        commands.map((command) => ({
          order_id: order.id,
          minecraft_username: username,
          command: command.replaceAll("{username}", username),
          kind: "grant",
        })),
      );
    }

    await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        minecraft_username: username,
        paid_at: new Date().toISOString(),
        payment_ref: data.paymentRef ?? order.payment_ref,
      })
      .eq("id", order.id);

    await audit(staff, "order.deliver", order.reference, { username, commands: commands.length });
    return { ok: true, queued: commands.length };
  });

/** Refund an order and queue commands that take the package back off the player. */
export const refundAndRevoke = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => orderAction.parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (error) throw new Error(error.message);

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("revoke_commands")
      .eq("id", order.product_id)
      .maybeSingle();

    // Cancel anything still waiting to be delivered, then queue the rollback.
    await supabaseAdmin
      .from("delivery_jobs")
      .update({ status: "revoked" })
      .eq("order_id", order.id)
      .eq("status", "pending");

    const commands = (product?.revoke_commands as string[] | null) ?? [];
    if (commands.length && order.status !== "pending") {
      await supabaseAdmin.from("delivery_jobs").insert(
        commands.map((command) => ({
          order_id: order.id,
          minecraft_username: order.minecraft_username,
          command: command.replaceAll("{username}", order.minecraft_username),
          kind: "revoke",
        })),
      );
    }

    await supabaseAdmin
      .from("orders")
      .update({
        status: "refunded",
        refunded_at: new Date().toISOString(),
        refunded_by: staff.userId,
        refund_reason: data.reason ?? null,
      })
      .eq("id", order.id);

    await audit(staff, "order.refund", order.reference, { reason: data.reason ?? null });
    return { ok: true, revoked: commands.length };
  });

/** Correct a mistyped Minecraft username on an order. */
export const fixUsername = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => orderAction.extend({ username: z.string().trim() }).parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ minecraft_username: data.username })
      .eq("id", data.orderId);
    if (error) throw new Error(error.message);
    await audit(staff, "order.username_fix", data.orderId, { username: data.username });
    return { ok: true };
  });

/** Owner only: grant or revoke editor access for a staff email. */
export const setEditorAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; grant: boolean }) =>
    z.object({ email: z.string().trim().email().max(255), grant: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    if (staff.role !== "owner") throw new Error("Only the owner can manage access.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .ilike("email", data.email)
      .maybeSingle();

    if (!profile) {
      throw new Error("That person needs to create an account on the site first.");
    }

    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: profile.id, role: "editor" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", profile.id)
        .eq("role", "editor");
      if (error) throw new Error(error.message);
    }

    await audit(staff, data.grant ? "access.grant" : "access.revoke", data.email);
    return { ok: true };
  });

/** Owner only: issue a fresh delivery key for the server bridge script. */
export const rotateBridgeToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const staff = await requireStaff(context);
    if (staff.role !== "owner") throw new Error("Only the owner can rotate the delivery key.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "bridge", value: { token } as never, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    await audit(staff, "bridge.rotate", "site_settings/bridge");
    return { token };
  });
