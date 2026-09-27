import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * New module: Ticket / Support system.
 * A player never needs an account — submitting a ticket returns a long
 * random reference code, which is the only way to look the ticket back up.
 */

function genReference() {
  return `TCK-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

const submitInput = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{3,16}$/, "Enter a valid Minecraft username"),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(5).max(2000),
});

export const submitTicket = createServerFn({ method: "POST" })
  .inputValidator((data) => submitInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reference = genReference();
    const { error } = await supabaseAdmin.from("tickets").insert({
      reference,
      minecraft_username: data.username,
      email: data.email || null,
      subject: data.subject,
      message: data.message,
      status: "open",
    });
    if (error) throw new Error(error.message);
    return { reference };
  });

const refInput = z.object({ reference: z.string().trim().min(5).max(40) });

export const getTicketStatus = createServerFn({ method: "POST" })
  .inputValidator((data) => refInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket, error } = await supabaseAdmin
      .from("tickets")
      .select("*")
      .eq("reference", data.reference.trim().toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) throw new Error("No ticket found for that reference code.");

    const { data: replies } = await supabaseAdmin
      .from("ticket_replies")
      .select("sender, message, created_at")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    return { ticket, replies: replies ?? [] };
  });

const replyInput = z.object({
  reference: z.string().trim().min(5).max(40),
  message: z.string().trim().min(1).max(2000),
});

export const replyAsPlayer = createServerFn({ method: "POST" })
  .inputValidator((data) => replyInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket, error } = await supabaseAdmin
      .from("tickets")
      .select("id, status")
      .eq("reference", data.reference.trim().toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) throw new Error("No ticket found for that reference code.");

    await supabaseAdmin.from("ticket_replies").insert({
      ticket_id: ticket.id,
      sender: "player",
      message: data.message,
    });
    await supabaseAdmin
      .from("tickets")
      .update({ status: ticket.status === "closed" ? "open" : ticket.status, updated_at: new Date().toISOString() })
      .eq("id", ticket.id);

    return { ok: true };
  });
