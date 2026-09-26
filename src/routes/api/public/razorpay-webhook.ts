import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getRazorpay, hmac, safeEqualHex, payAndQueue } = await import("@/lib/payments.server");
        const cfg = await getRazorpay(supabaseAdmin);
        if (!cfg?.webhookSecret || !safeEqualHex(signature, hmac(cfg.webhookSecret, body))) {
          return new Response("Invalid signature", { status: 401 });
        }
        const evt = JSON.parse(body);
        const payment = evt?.payload?.payment?.entity;
        if ((evt.event === "payment.captured" || evt.event === "order.paid") && payment?.order_id) {
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("id")
            .eq("payment_ref", payment.order_id)
            .maybeSingle();
          if (order) await payAndQueue(supabaseAdmin, order.id, payment.id);
        }
        return new Response("ok");
      },
    },
  },
});
