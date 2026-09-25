import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

async function authorize(request: Request) {
  const token = request.headers.get("x-bridge-token") ?? "";
  if (token.length < 32) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "bridge")
    .maybeSingle();
  const expected = (data?.value as { token?: string } | null)?.token;
  if (!expected || expected !== token) return null;
  return supabaseAdmin;
}

const ackSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.string().uuid(),
        ok: z.boolean(),
        error: z.string().max(500).optional(),
      }),
    )
    .max(100),
});

export const Route = createFileRoute("/api/public/bridge")({
  server: {
    handlers: {
      // Minecraft-side bridge pulls pending commands
      GET: async ({ request }) => {
        const db = await authorize(request);
        if (!db) return new Response("Unauthorized", { status: 401 });
        const { data, error } = await db
          .from("delivery_jobs")
          .select("id, command, kind, minecraft_username")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(50);
        if (error) return new Response("Server error", { status: 500 });
        return Response.json({ jobs: data ?? [] });
      },
      // Bridge reports which commands ran
      POST: async ({ request }) => {
        const db = await authorize(request);
        if (!db) return new Response("Unauthorized", { status: 401 });
        const parsed = ackSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });

        for (const r of parsed.data.results) {
          const { data: job } = await db
            .from("delivery_jobs")
            .select("attempts, order_id")
            .eq("id", r.id)
            .maybeSingle();
          if (!job) continue;
          const attempts = job.attempts + 1;
          await db
            .from("delivery_jobs")
            .update(
              r.ok
                ? { status: "done", attempts, executed_at: new Date().toISOString(), last_error: null }
                : {
                    status: attempts >= 5 ? "failed" : "pending",
                    attempts,
                    last_error: r.error ?? "unknown",
                  },
            )
            .eq("id", r.id);

          if (r.ok) {
            const { count } = await db
              .from("delivery_jobs")
              .select("id", { count: "exact", head: true })
              .eq("order_id", job.order_id)
              .eq("kind", "grant")
              .neq("status", "done");
            if (count === 0) {
              await db
                .from("orders")
                .update({ status: "delivered", delivered_at: new Date().toISOString() })
                .eq("id", job.order_id)
                .eq("status", "paid");
            }
          }
        }
        return Response.json({ ok: true });
      },
    },
  },
});
