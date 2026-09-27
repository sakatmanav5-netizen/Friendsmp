import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { defaultContent, type SiteContent } from "@/lib/site-content";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type PublicProduct = {
  id: string;
  category: string;
  name: string;
  price: number;
  blurb: string;
  perks: string[];
  featured: boolean;
};

/** Site text + accent colour (owner-editable) and the live store catalog. */
export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [settings, products] = await Promise.all([
    supabase.from("site_settings").select("key, value").in("key", ["content", "design", "social", "media"]),
    supabase
      .from("products")
      .select("id, category, name, price, blurb, perks, featured")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const settingsMap = Object.fromEntries((settings.data ?? []).map((s) => [s.key, s.value]));

  const stored = (settingsMap["content"] ?? {}) as Partial<SiteContent> & { accent?: string };
  const content: SiteContent & { accent: string } = {
    ...defaultContent,
    accent: "purple",
    ...stored,
    news: { ...defaultContent.news, ...(stored.news ?? {}) },
  };
  const design = (settingsMap["design"] ?? {}) as Record<string, unknown>;
  const social = (settingsMap["social"] ?? {}) as Record<string, unknown>;
  const media = (settingsMap["media"] ?? {}) as Record<string, unknown>;

  const catalog: PublicProduct[] = (products.data ?? []).map((p) => ({
    id: p.id,
    category: p.category,
    name: p.name,
    price: Number(p.price),
    blurb: p.blurb,
    perks: Array.isArray(p.perks) ? (p.perks as string[]) : [],
    featured: p.featured,
  }));

  return { content, products: catalog, design, social, media };
});

const orderInput = z.object({
  productId: z.string().min(1).max(64),
  username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{3,16}$/, "Enter a valid Minecraft username"),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

/** Guest checkout: records the order in the ledger as pending payment. */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data) => orderInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, active")
      .eq("id", data.productId)
      .maybeSingle();

    if (productError) throw new Error(productError.message);
    if (!product || !product.active) throw new Error("That package is no longer available.");

    const reference = `FSMP-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        reference,
        product_id: product.id,
        product_name: product.name,
        amount: product.price,
        minecraft_username: data.username,
        buyer_email: data.email ? data.email : null,
        status: "pending",
        payment_method: "manual",
      })
      .select("id, reference, product_name, amount, minecraft_username")
      .single();

    if (error) throw new Error(error.message);

    const { getRazorpay } = await import("@/lib/payments.server");
    const cfg = await getRazorpay(supabaseAdmin);
    let razorpay: { keyId: string; orderId: string; amount: number; currency: string } | null = null;
    if (cfg && Number(order.amount) > 0) {
      const currency = cfg.currency || "INR";
      const amount = Math.round(Number(order.amount) * 100);
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Basic ${btoa(`${cfg.keyId}:${cfg.keySecret}`)}`,
        },
        body: JSON.stringify({ amount, currency, receipt: order.reference }),
      });
      if (res.ok) {
        const rp = (await res.json()) as { id: string };
        await supabaseAdmin
          .from("orders")
          .update({ payment_ref: rp.id, payment_method: "razorpay" })
          .eq("id", order.id);
        razorpay = { keyId: cfg.keyId, orderId: rp.id, amount, currency };
      } else {
        console.error("razorpay order failed", res.status, await res.text());
      }
    }

    return {
      reference: order.reference,
      product_name: order.product_name,
      amount: order.amount,
      minecraft_username: order.minecraft_username,
      razorpay,
    };
  });

/** Called after Razorpay checkout succeeds; verifies the signature and queues delivery. */
export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        orderId: z.string().min(5).max(64),
        paymentId: z.string().min(5).max(64),
        signature: z.string().min(10).max(256),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRazorpay, hmac, safeEqualHex, payAndQueue } = await import("@/lib/payments.server");
    const cfg = await getRazorpay(supabaseAdmin);
    if (!cfg) throw new Error("Payments are not configured.");
    if (!safeEqualHex(data.signature, hmac(cfg.keySecret, `${data.orderId}|${data.paymentId}`))) {
      throw new Error("Payment could not be verified.");
    }
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("payment_ref", data.orderId)
      .maybeSingle();
    if (!order) throw new Error("Order not found.");
    await payAndQueue(supabaseAdmin, order.id, data.paymentId);
    return { ok: true };
  });
