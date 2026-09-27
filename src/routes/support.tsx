import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Send } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { submitTicket, getTicketStatus, replyAsPlayer } from "@/lib/support.functions";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — FriendSMP" },
      { name: "description", content: "Submit a support ticket or check the status of an existing one." },
      { property: "og:title", content: "FriendSMP Support" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

const input =
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const label = "mb-1 block text-[11px] font-bold text-muted-foreground";

const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;

function SupportPage() {
  const [mode, setMode] = useState<"new" | "status">("new");

  return (
    <PageShell kicker="SUPPORT" title="Need help?" subtitle="Open a ticket or check one you already sent — no account needed.">
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setMode("new")}
          className={`rounded-full px-4 py-2 text-xs font-bold ${mode === "new" ? "btn-neon" : "bg-accent"}`}
        >
          New ticket
        </button>
        <button
          onClick={() => setMode("status")}
          className={`rounded-full px-4 py-2 text-xs font-bold ${mode === "status" ? "btn-neon" : "bg-accent"}`}
        >
          Check status
        </button>
      </div>
      {mode === "new" ? <NewTicket /> : <CheckStatus />}
    </PageShell>
  );
}

function NewTicket() {
  const submit = useServerFn(submitTicket);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!USERNAME_RE.test(username)) {
      toast.error("Enter a valid Minecraft username");
      return;
    }
    setBusy(true);
    try {
      const r = await submit({ data: { username, email, subject, message } });
      setReference(r.reference);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (reference) {
    return (
      <div className="max-w-md rounded-3xl glass neon-ring p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full btn-neon">
          <Check className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-lg font-black">Ticket submitted!</p>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Save this reference code to check replies later:
        </p>
        <p className="mt-2 rounded-xl bg-accent px-3 py-2 font-mono text-sm font-bold">{reference}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3 rounded-3xl glass p-6">
      <div>
        <label className={label}>Minecraft username</label>
        <input className={input} value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div>
        <label className={label}>Email (optional)</label>
        <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className={label}>Subject</label>
        <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={120} />
      </div>
      <div>
        <label className={label}>What's going on?</label>
        <textarea
          className={`${input} min-h-28`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={2000}
        />
      </div>
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full btn-neon px-4 py-3 text-sm font-bold disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit ticket
      </button>
    </form>
  );
}

function CheckStatus() {
  const check = useServerFn(getTicketStatus);
  const reply = useServerFn(replyAsPlayer);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof getTicketStatus>> | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await check({ data: { reference } });
      setData(r);
    } catch (e) {
      toast.error((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await reply({ data: { reference, message } });
      setMessage("");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex gap-2 rounded-3xl glass p-3">
        <input
          className={input}
          placeholder="TCK-XXXXXXXXXX"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <button onClick={load} disabled={loading || !reference.trim()} className="shrink-0 rounded-full btn-neon px-4 py-2 text-xs font-bold disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Check"}
        </button>
      </div>

      {data && (
        <div className="rounded-3xl glass neon-ring p-5">
          <p className="font-display text-base font-black">{data.ticket.subject}</p>
          <p className="mt-1 text-[11px] font-bold uppercase text-neon-soft">{data.ticket.status.replace("_", " ")}</p>
          <p className="mt-3 whitespace-pre-wrap text-[13px] text-muted-foreground">{data.ticket.message}</p>

          <div className="mt-4 space-y-2">
            {data.replies.map((r, i) => (
              <div key={i} className={`rounded-xl p-2.5 text-[12px] ${r.sender === "staff" ? "bg-primary/20" : "bg-accent/40"}`}>
                <p className="text-[10px] font-bold text-muted-foreground">{r.sender === "staff" ? "Staff" : "You"}</p>
                <p className="mt-0.5 whitespace-pre-wrap">{r.message}</p>
              </div>
            ))}
          </div>

          {data.ticket.status !== "closed" && (
            <div className="mt-3 flex gap-2">
              <input className={input} placeholder="Add a reply…" value={message} onChange={(e) => setMessage(e.target.value)} />
              <button onClick={sendReply} disabled={sending} className="shrink-0 rounded-full btn-neon px-4 py-2 text-xs font-bold disabled:opacity-50">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
