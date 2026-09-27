import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, TrendingUp, X } from "lucide-react";

import {
  getAnalytics,
  getTicketsAdmin,
  getTicketThread,
  replyAsStaff,
  updateTicketStatus,
} from "@/lib/admin.functions";

const input =
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const btn = "rounded-full btn-neon px-4 py-2 text-xs font-bold disabled:opacity-50";
const ghost = "rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold hover:bg-accent/70";

function useAction() {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, ok: string, done: () => void) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      done();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

/* ===================== Analytics ===================== */

export function Analytics() {
  const load = useServerFn(getAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: () => load() });

  if (isLoading || !data) return <Loader2 className="h-6 w-6 animate-spin" />;

  const maxRevenue = Math.max(1, ...data.revenueByDay.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-black">Analytics</h3>
        <p className="text-[12px] text-muted-foreground">Last {data.windowDays} days, computed from your orders.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Revenue" value={`₹${data.totalRevenue.toFixed(0)}`} icon={<TrendingUp className="h-3.5 w-3.5" />} />
        <Stat label="Orders" value={String(data.totalOrders)} />
        <Stat label="Paid" value={String(data.counts["paid"] ?? 0)} />
        <Stat label="Pending" value={String(data.counts["pending"] ?? 0)} />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold text-muted-foreground">Revenue by day</p>
        <div className="flex h-32 items-end gap-1 rounded-xl bg-accent/30 p-3">
          {data.revenueByDay.length === 0 && (
            <span className="text-[12px] text-muted-foreground">No paid orders yet.</span>
          )}
          {data.revenueByDay.map((d) => (
            <div key={d.day} className="group relative flex-1" title={`${d.day}: ₹${d.revenue.toFixed(0)}`}>
              <div
                className="w-full rounded-t-sm btn-neon"
                style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold text-muted-foreground">Top products</p>
        <div className="space-y-1.5">
          {data.topProducts.length === 0 && <p className="text-[12px] text-muted-foreground">Nothing sold yet.</p>}
          {data.topProducts.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-lg bg-accent/40 px-3 py-2 text-[12px]">
              <span className="font-semibold">{p.name}</span>
              <span className="text-muted-foreground">
                {p.count} sold · ₹{p.revenue.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-accent/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-xl font-black">{value}</div>
    </div>
  );
}

/* ===================== Ticket System ===================== */

const statusColor: Record<string, string> = {
  open: "text-gold",
  in_progress: "text-cyan",
  closed: "text-online",
};

export function Tickets() {
  const qc = useQueryClient();
  const load = useServerFn(getTicketsAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["tickets"], queryFn: () => load() });
  const [openId, setOpenId] = useState<string | null>(null);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["tickets"] });
    qc.invalidateQueries({ queryKey: ["ticket-thread", openId] });
  };

  if (isLoading || !data) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-black">Support Tickets</h3>
        <p className="text-[12px] text-muted-foreground">Players submit these from /support with no account needed.</p>
      </div>

      {data.tickets.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">No tickets yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Ref</th>
                <th className="py-2 pr-3">Player</th>
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.tickets.map((t) => (
                <tr key={t.id} className="border-t border-border/40">
                  <td className="py-2 pr-3 font-mono text-[11px]">{t.reference}</td>
                  <td className="py-2 pr-3">{t.minecraft_username}</td>
                  <td className="py-2 pr-3">{t.subject}</td>
                  <td className={`py-2 pr-3 font-bold ${statusColor[t.status] ?? ""}`}>{t.status}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{new Date(t.updated_at).toLocaleString()}</td>
                  <td className="py-2">
                    <button onClick={() => setOpenId(t.id)} className={ghost}>
                      <MessageSquare className="mr-1 inline h-3 w-3" /> Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && <TicketThread ticketId={openId} onClose={() => setOpenId(null)} onDone={refresh} />}
    </div>
  );
}

function TicketThread({ ticketId, onClose, onDone }: { ticketId: string; onClose: () => void; onDone: () => void }) {
  const loadThread = useServerFn(getTicketThread);
  const reply = useServerFn(replyAsStaff);
  const setStatus = useServerFn(updateTicketStatus);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ticket-thread", ticketId],
    queryFn: () => loadThread({ data: { ticketId } }),
  });
  const [message, setMessage] = useState("");
  const { busy, run } = useAction();

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl glass neon-ring p-5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-base font-black">Ticket</h4>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading || !data ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <div className="rounded-xl bg-accent/40 p-3 text-[12px]">
              <p className="font-bold">{data.ticket.subject}</p>
              <p className="text-muted-foreground">
                {data.ticket.minecraft_username} {data.ticket.email ? `· ${data.ticket.email}` : ""} · {data.ticket.reference}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{data.ticket.message}</p>
            </div>

            <div className="mt-3 space-y-2">
              {data.replies.map((r: any) => (
                <div
                  key={r.id}
                  className={`rounded-xl p-2.5 text-[12px] ${r.sender === "staff" ? "bg-primary/20" : "bg-accent/40"}`}
                >
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {r.sender === "staff" ? `Staff${r.staff_email ? ` (${r.staff_email})` : ""}` : "Player"} ·{" "}
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>

            <textarea
              className={`${input} mt-3 min-h-20`}
              placeholder="Write a reply…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                disabled={busy || !message.trim()}
                onClick={() =>
                  run(
                    async () => {
                      await reply({ data: { ticketId, message } });
                      setMessage("");
                      await refetch();
                    },
                    "Reply sent",
                    onDone,
                  )
                }
                className={btn}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reply"}
              </button>
              {(["open", "in_progress", "closed"] as const).map((s) => (
                <button
                  key={s}
                  disabled={busy || data.ticket.status === s}
                  onClick={() =>
                    run(
                      async () => {
                        await setStatus({ data: { ticketId, status: s } });
                        await refetch();
                      },
                      `Marked ${s}`,
                      onDone,
                    )
                  }
                  className={`${ghost} disabled:opacity-40`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
