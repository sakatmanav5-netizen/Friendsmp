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
      content: (settingsMap["content"] ?? {}) as Record<string, any>,
      design: (settingsMap["design"] ?? {}) as Record<string, any>,
      media: (settingsMap["media"] ?? {}) as Record<string, any>,
      social: (settingsMap["social"] ?? {}) as Record<string, any>,
      serverStatus: (settingsMap["server_status"] ?? {}) as Record<string, any>,
      razorpay:
        staff.role === "owner"
          ? {
              keyId: ((settingsMap["razorpay"] as any)?.keyId as string) ?? "",
              hasSecret: Boolean((settingsMap["razorpay"] as any)?.keySecret),
              hasWebhook: Boolean((settingsMap["razorpay"] as any)?.webhookSecret),
              currency: ((settingsMap["razorpay"] as any)?.currency as string) ?? "INR",
            }
          : null,
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

/** Owner only: store Razorpay keys. Blank secret fields keep the existing value. */
export const saveRazorpay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        keyId: z.string().trim().max(100),
        keySecret: z.string().trim().max(200),
        webhookSecret: z.string().trim().max(200),
        currency: z.string().trim().length(3),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    if (staff.role !== "owner") throw new Error("Only the owner can change payments.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin.from("site_settings").select("value").eq("key", "razorpay").maybeSingle();
    const old = (cur?.value ?? {}) as Record<string, string>;
    const value = {
      keyId: data.keyId,
      keySecret: data.keySecret || old["keySecret"] || "",
      webhookSecret: data.webhookSecret || old["webhookSecret"] || "",
      currency: data.currency.toUpperCase(),
    };
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "razorpay", value: value as never, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    await audit(staff, "payments.save", "site_settings/razorpay");
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * New modules: Visual Website Builder, Social Links, Server Status.
 * These are additive — they don't touch content/products/access/etc.
 * ------------------------------------------------------------------ */

const mediaInput = z.object({
  heroImage: z.string().trim().max(600).optional().or(z.literal("")),
  logoImage: z.string().trim().max(600).optional().or(z.literal("")),
  cardImages: z
    .object({
      ranks: z.string().trim().max(600).optional().or(z.literal("")),
      crates: z.string().trim().max(600).optional().or(z.literal("")),
      coins: z.string().trim().max(600).optional().or(z.literal("")),
    })
    .partial(),
});

/** Save the public URLs of images uploaded via the Media Manager (files
 * themselves go straight to Supabase Storage from the browser). */
export const saveMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { media: z.infer<typeof mediaInput> }) => ({
    media: mediaInput.parse(data.media),
  }))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({
        key: "media",
        value: data.media as never,
        updated_at: new Date().toISOString(),
        updated_by: staff.userId,
      });
    if (error) throw new Error(error.message);
    await audit(staff, "media.save", "site_settings/media");
    return { ok: true };
  });

/** Save the visual builder's design tokens (colours, radius, glow, layout). */
export const saveDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { design: Record<string, unknown> }) => data)
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({
        key: "design",
        value: data.design as never,
        updated_at: new Date().toISOString(),
        updated_by: staff.userId,
      });
    if (error) throw new Error(error.message);
    await audit(staff, "design.save", "site_settings/design");
    return { ok: true };
  });

const socialInput = z.object({
  discord: z.string().trim().max(300).optional().or(z.literal("")),
  instagram: z.string().trim().max(300).optional().or(z.literal("")),
  youtube: z.string().trim().max(300).optional().or(z.literal("")),
  telegram: z.string().trim().max(300).optional().or(z.literal("")),
});

/** Save footer / social links. */
export const saveSocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => socialInput.parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({
        key: "social",
        value: data as never,
        updated_at: new Date().toISOString(),
        updated_by: staff.userId,
      });
    if (error) throw new Error(error.message);
    await audit(staff, "social.save", "site_settings/social");
    return { ok: true };
  });

const serverStatusInput = z.object({
  mode: z.enum(["live", "manual"]),
  manualOnline: z.boolean(),
  manualPlayers: z.number().min(0).max(100000),
  manualMaxPlayers: z.number().min(0).max(100000),
  manualMotd: z.string().trim().max(200),
  manualVersion: z.string().trim().max(60),
});

/** Owner/editor: choose live (pinged) or manual server status, and the manual fallback values. */
export const saveServerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => serverStatusInput.parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({
        key: "server_status",
        value: data as never,
        updated_at: new Date().toISOString(),
        updated_by: staff.userId,
      });
    if (error) throw new Error(error.message);
    await audit(staff, "server_status.save", "site_settings/server_status");
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * New modules: Analytics & Ticket System.
 * ------------------------------------------------------------------ */

/** Revenue / order stats computed from the existing `orders` table. */
export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("status, amount, product_name, created_at, paid_at")
      .gte("created_at", since.toISOString());
    if (error) throw new Error(error.message);

    const rows = orders ?? [];
    const paid = rows.filter((o) => o.status === "paid" || o.status === "delivered");
    const totalRevenue = paid.reduce((sum, o) => sum + Number(o.amount), 0);
    const counts = { pending: 0, paid: 0, delivered: 0, refunded: 0 } as Record<string, number>;
    for (const o of rows) counts[o.status] = (counts[o.status] ?? 0) + 1;

    const byDay = new Map<string, number>();
    for (const o of paid) {
      const day = (o.paid_at ?? o.created_at).slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(o.amount));
    }
    const revenueByDay = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, revenue]) => ({ day, revenue }));

    const byProduct = new Map<string, { count: number; revenue: number }>();
    for (const o of paid) {
      const cur = byProduct.get(o.product_name) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(o.amount);
      byProduct.set(o.product_name, cur);
    }
    const topProducts = Array.from(byProduct.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      totalRevenue,
      totalOrders: rows.length,
      counts,
      revenueByDay,
      topProducts,
      windowDays: 30,
    };
  });

/** Staff: list tickets (newest first), lightweight fields for the table view. */
export const getTicketsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("tickets")
      .select("id, reference, minecraft_username, email, subject, status, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { tickets: data ?? [] };
  });

const ticketIdInput = z.object({ ticketId: z.string().uuid() });

/** Staff: full thread for one ticket. */
export const getTicketThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => ticketIdInput.parse(data))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket, error } = await supabaseAdmin
      .from("tickets")
      .select("*")
      .eq("id", data.ticketId)
      .single();
    if (error) throw new Error(error.message);
    const { data: replies } = await supabaseAdmin
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", data.ticketId)
      .order("created_at", { ascending: true });
    return { ticket, replies: replies ?? [] };
  });

const replyAsStaffInput = z.object({
  ticketId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
  status: z.enum(["open", "in_progress", "closed"]).optional(),
});

/** Staff: reply to a ticket, optionally updating its status in the same action. */
export const replyAsStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => replyAsStaffInput.parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ticket_replies").insert({
      ticket_id: data.ticketId,
      sender: "staff",
      staff_email: staff.email,
      message: data.message,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("tickets")
      .update({ status: data.status ?? "in_progress", updated_at: new Date().toISOString() })
      .eq("id", data.ticketId);

    await audit(staff, "ticket.reply", data.ticketId);
    return { ok: true };
  });

const ticketStatusInput = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "closed"]),
});

/** Staff: change a ticket's status without necessarily replying. */
export const updateTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => ticketStatusInput.parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("tickets")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.ticketId);
    if (error) throw new Error(error.message);
    await audit(staff, "ticket.status", data.ticketId, { status: data.status });
    return { ok: true };
  });

const newProductInput = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,40}$/, "Use lowercase letters, numbers and dashes only"),
  category: z.enum(["ranks", "crates", "coins"]),
  name: z.string().trim().min(1).max(60),
  price: z.number().min(0).max(100000),
  blurb: z.string().max(400).default(""),
});

/** Create a brand new store package (rank / crate key / coin bundle). */
export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => newProductInput.parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: last } = await supabaseAdmin
      .from("products")
      .select("sort_order")
      .eq("category", data.category)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const slug = data.name.toLowerCase().replace(/rank|tag|key|crate|coins?/g, "").replace(/[^a-z0-9]+/g, "").trim() || data.id.split("-").pop()!;
    const amt = Number(data.name.match(/\d+/)?.[0] ?? 100);
    const grant =
      data.category === "ranks" ? [`lp user {username} parent add ${slug}`]
      : data.category === "crates" ? [`crate give {username} ${slug} 1`]
      : [`eco give {username} ${amt}`];
    const revoke =
      data.category === "ranks" ? [`lp user {username} parent remove ${slug}`]
      : data.category === "crates" ? [`crate take {username} ${slug} 1`]
      : [`eco take {username} ${amt}`];
    const { error } = await supabaseAdmin.from("products").insert({
      id: data.id,
      category: data.category,
      name: data.name,
      price: data.price,
      blurb: data.blurb,
      perks: [] as never,
      rcon_commands: grant as never,
      revoke_commands: revoke as never,
      featured: false,
      active: true,
      sort_order: (last?.sort_order ?? 0) + 1,
    });
    if (error) throw new Error(error.message);
    await audit(staff, "product.create", data.id, { name: data.name, price: data.price });
    return { ok: true };
  });

/** Permanently delete a store package. Past orders keep their own records. */
export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().trim().min(1).max(60) }).parse(data))
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(staff, "product.delete", data.id, {});
    return { ok: true };
  });
