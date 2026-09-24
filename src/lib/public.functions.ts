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
    supabase.from("site_settings").select("value").eq("key", "content").maybeSingle(),
    supabase
      .from("products")
      .select("id, category, name, price, blurb, perks, featured")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const stored = (settings.data?.value ?? {}) as Partial<SiteContent> & { accent?: string };
  const content: SiteContent & { accent: string } = {
    ...defaultContent,
    accent: "purple",
    ...stored,
    news: { ...defaultContent.news, ...(stored.news ?? {}) },
  };

  const catalog: PublicProduct[] = (products.data ?? []).map((p) => ({
    id: p.id,
    category: p.category,
    name: p.name,
    price: Number(p.price),
    blurb: p.blurb,
    perks: Array.isArray(p.perks) ? (p.perks as string[]) : [],
    featured: p.featured,
  }));

  return { content, products: catalog };
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
      .select("reference, product_name, amount, minecraft_username")
      .single();

    if (error) throw new Error(error.message);
    return order;
  });
