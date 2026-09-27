import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  getAdminData,
  getMyAccess,
  markPaidAndDeliver,
  refundAndRevoke,
  fixUsername,
  saveContent,
  saveProduct,
  createProduct,
  deleteProduct,
  setEditorAccess,
  rotateBridgeToken,
  saveRazorpay,
} from "@/lib/admin.functions";
import { Design, Media, Social, ServerStatusPanel } from "@/components/admin/ExtraModules";
import { Analytics, Tickets } from "@/components/admin/SupportModules";

export const Route = createFileRoute("/fsmp-control")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Control — FriendSMP" },
      { name: "description", content: "Private staff area." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "FriendSMP" },
      { property: "og:description", content: "Private staff area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ControlPage,
});

const input =
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const btn = "rounded-full btn-neon px-4 py-2 text-xs font-bold disabled:opacity-50";
const ghost = "rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold hover:bg-accent/70";

function ControlPage() {
  const [session, setSession] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === null)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  return (
    <div className="min-h-screen canvas-glow px-4 py-8">
      <div className="mx-auto max-w-6xl">{session ? <Dashboard /> : <Login />}</div>
    </div>
  );
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/fsmp-control` },
          });
    setBusy(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    if (mode === "up") toast.success("Check your email to confirm your account.");
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-20 max-w-sm space-y-3 rounded-3xl glass neon-ring p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-neon-soft" />
        <h1 className="font-display text-2xl font-black">Staff Portal</h1>
      </div>
      <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={input} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button disabled={busy} className={`${btn} w-full py-3`}>
        {mode === "in" ? "Sign in" : "Create account"}
      </button>
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-[12px] text-muted-foreground">
        {mode === "in" ? "First time? Create your account" : "Have an account? Sign in"}
      </button>
    </form>
  );
}

type Tab =
  | "orders"
  | "products"
  | "content"
  | "design"
  | "media"
  | "social"
  | "status"
  | "analytics"
  | "tickets"
  | "access"
  | "bridge"
  | "audit";

function Dashboard() {
  const qc = useQueryClient();
  const access = useServerFn(getMyAccess);
  const load = useServerFn(getAdminData);
  const me = useQuery({ queryKey: ["access"], queryFn: () => access() });
  const data = useQuery({ queryKey: ["admin"], queryFn: () => load(), enabled: !!me.data?.isStaff });
  const [tab, setTab] = useState<Tab>("orders");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
  };

  if (me.isLoading) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin" />;
  if (!me.data?.isStaff)
    return (
      <div className="mx-auto mt-20 max-w-sm rounded-3xl glass p-6 text-center">
        <p className="text-sm">This account ({me.data?.email}) has no staff access.</p>
        <button onClick={signOut} className={`${ghost} mt-4`}>Sign out</button>
      </div>
    );

  const tabs: Tab[] = [
    "orders",
    "products",
    "content",
    "design",
    "media",
    "social",
    "status",
    "analytics",
    "tickets",
    "access",
    "bridge",
    "audit",
  ];
  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-[11px] text-muted-foreground">← Back to site</Link>
          <h1 className="font-display text-3xl font-black">Owner Control</h1>
          <p className="text-[12px] text-muted-foreground">
            {me.data.email} · {me.data.isOwner ? "Owner" : "Editor"}
          </p>
        </div>
        <button onClick={signOut} className={`${ghost} flex items-center gap-1`}>
          <LogOut className="h-3 w-3" /> Sign out
        </button>
      </header>
      <nav className="mb-5 flex flex-wrap gap-2">
        {tabs
          .filter((t) => me.data!.isOwner || (t !== "access" && t !== "bridge"))
          .map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? btn : ghost}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
      </nav>
      {!data.data ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <section className="rounded-3xl glass p-5">
          {tab === "orders" && <Orders orders={data.data.orders} jobs={data.data.jobs} onDone={refresh} />}
          {tab === "products" && <Products products={data.data.products} onDone={refresh} />}
          {tab === "content" && <Content content={data.data.content} onDone={refresh} />}
          {tab === "design" && <Design design={data.data.design} onDone={refresh} />}
          {tab === "media" && <Media media={data.data.media} onDone={refresh} />}
          {tab === "social" && <Social social={data.data.social} onDone={refresh} />}
          {tab === "status" && <ServerStatusPanel status={data.data.serverStatus} onDone={refresh} />}
          {tab === "analytics" && <Analytics />}
          {tab === "tickets" && <Tickets />}
          {tab === "access" && <Access staff={data.data.staff} onDone={refresh} />}
          {tab === "bridge" && (<><Payments cfg={data.data.razorpay} onDone={refresh} /><Bridge token={data.data.bridgeToken} onDone={refresh} /></>)}
          {tab === "audit" && <Audit rows={data.data.audit} />}
        </section>
      )}
    </>
  );
}

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

const statusColor: Record<string, string> = {
  pending: "text-gold",
  paid: "text-cyan",
  delivered: "text-online",
  refunded: "text-destructive",
};

function Orders({ orders, jobs, onDone }: { orders: any[]; jobs: any[]; onDone: () => void }) {
  const deliver = useServerFn(markPaidAndDeliver);
  const refund = useServerFn(refundAndRevoke);
  const fix = useServerFn(fixUsername);
  const { busy, run } = useAction();
  const [q, setQ] = useState("");
  const list = orders.filter((o) =>
    `${o.reference} ${o.minecraft_username} ${o.product_name}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-black">Transaction Ledger</h2>
        <input className={`${input} max-w-xs`} placeholder="Search reference / username" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="text-muted-foreground">
            <tr>
              <th className="p-2">Time</th><th className="p-2">Transaction</th><th className="p-2">Package</th>
              <th className="p-2">Amount</th><th className="p-2">Username</th><th className="p-2">Status</th><th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => {
              const oj = jobs.filter((j) => j.order_id === o.id);
              return (
                <tr key={o.id} className="border-t border-border align-top">
                  <td className="p-2 whitespace-nowrap">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="p-2 font-mono">{o.reference}</td>
                  <td className="p-2">{o.product_name}</td>
                  <td className="p-2">${Number(o.amount).toFixed(2)}</td>
                  <td className="p-2 font-semibold">{o.minecraft_username}</td>
                  <td className={`p-2 font-bold ${statusColor[o.status] ?? ""}`}>
                    {o.status}
                    {oj.length > 0 && (
                      <div className="font-normal text-muted-foreground">
                        {oj.filter((j) => j.status === "done").length}/{oj.length} cmds run
                      </div>
                    )}
                    {o.refund_reason && <div className="font-normal text-muted-foreground">{o.refund_reason}</div>}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {o.status === "pending" && (
                        <button disabled={busy} className={ghost} onClick={() => {
                          const ref = prompt("Payment reference (UPI / txn id), optional") ?? undefined;
                          run(() => deliver({ data: { orderId: o.id, paymentRef: ref || undefined } }), "Marked paid — delivery queued", onDone);
                        }}>Mark paid & deliver</button>
                      )}
                      {o.status !== "refunded" && (
                        <button disabled={busy} className={`${ghost} text-destructive`} onClick={() => {
                          const reason = prompt(`Refund ${o.reference} and revoke package? Reason:`);
                          if (reason === null) return;
                          run(() => refund({ data: { orderId: o.id, reason } }), "Refunded — package revoke queued", onDone);
                        }}>Issue Refund & Revoke</button>
                      )}
                      {o.status === "pending" && (
                        <button disabled={busy} className={ghost} onClick={() => {
                          const u = prompt("Correct Minecraft username", o.minecraft_username);
                          if (!u || !/^[A-Za-z0-9_]{3,16}$/.test(u)) return;
                          run(() => fix({ data: { orderId: o.id, username: u } }), "Username updated", onDone);
                        }}>Fix name</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!list.length && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No transactions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Products({ products, onDone }: { products: any[]; onDone: () => void }) {
  const create = useServerFn(createProduct);
  const { busy, run } = useAction();
  const [open, setOpen] = useState(false);
  const [n, setN] = useState({ id: "", category: "ranks", name: "", price: "", blurb: "" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-black">Store Packages</h2>
        <button className={btn} onClick={() => setOpen(!open)}>
          {open ? "Cancel" : "+ Add new package"}
        </button>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Use {"{username}"} in commands — it's replaced with the buyer's Minecraft name. One command per line.
      </p>
      {open && (
        <div className="space-y-2 rounded-2xl border border-primary/40 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-[11px] text-muted-foreground">Type
              <select className={input} value={n.category} onChange={(e) => setN({ ...n, category: e.target.value })}>
                <option value="ranks">Rank / Tag</option>
                <option value="crates">Crate Key</option>
                <option value="coins">Coins</option>
              </select>
            </label>
            <label className="block text-[11px] text-muted-foreground">Internal id (e.g. rank-elite)
              <input className={input} value={n.id} onChange={(e) => setN({ ...n, id: e.target.value })} placeholder="rank-elite" />
            </label>
            <label className="block text-[11px] text-muted-foreground">Display name
              <input className={input} value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} placeholder="ELITE Rank" />
            </label>
            <label className="block text-[11px] text-muted-foreground">Price
              <input className={input} type="number" step="0.01" value={n.price} onChange={(e) => setN({ ...n, price: e.target.value })} />
            </label>
          </div>
          <input className={input} value={n.blurb} onChange={(e) => setN({ ...n, blurb: e.target.value })} placeholder="Short description" />
          <button disabled={busy} className={btn} onClick={() =>
            run(() => create({ data: {
              id: n.id.trim().toLowerCase(), category: n.category as "ranks" | "crates" | "coins",
              name: n.name, price: Number(n.price) || 0, blurb: n.blurb,
            } }), `${n.name} created — now add its perks and commands below`, () => {
              setN({ id: "", category: "ranks", name: "", price: "", blurb: "" });
              setOpen(false);
              onDone();
            })
          }>Create package</button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {products.map((p) => <ProductEditor key={p.id} p={p} onDone={onDone} />)}
      </div>
    </div>
  );
}

function ProductEditor({ p, onDone }: { p: any; onDone: () => void }) {
  const save = useServerFn(saveProduct);
  const del = useServerFn(deleteProduct);
  const { busy, run } = useAction();
  const [f, setF] = useState({
    name: p.name as string,
    price: String(p.price),
    blurb: p.blurb as string,
    perks: (p.perks as string[]).join("\n"),
    rcon: (p.rcon_commands as string[]).join("\n"),
    revoke: (p.revoke_commands as string[]).join("\n"),
    featured: p.featured as boolean,
    active: p.active as boolean,
  });
  const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="space-y-2 rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-neon-soft">
        <span>{p.category.toUpperCase()} · {p.id}</span>
        <button
          disabled={busy}
          className="text-[10px] font-bold text-destructive hover:underline"
          onClick={() => {
            if (!confirm(`Delete "${p.name}" permanently? Past orders stay in the ledger.`)) return;
            run(() => del({ data: { id: p.id } }), `${p.name} deleted`, onDone);
          }}
        >
          DELETE
        </button>
      </div>
      <div className="grid grid-cols-[1fr_100px] gap-2">
        <input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={input} type="number" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
      </div>
      <input className={input} value={f.blurb} onChange={(e) => setF({ ...f, blurb: e.target.value })} placeholder="Short description" />
      <label className="block text-[11px] text-muted-foreground">Perks
        <textarea rows={3} className={input} value={f.perks} onChange={(e) => setF({ ...f, perks: e.target.value })} />
      </label>
      <label className="block text-[11px] text-muted-foreground">Delivery commands
        <textarea rows={2} className={`${input} font-mono text-[11px]`} value={f.rcon} onChange={(e) => setF({ ...f, rcon: e.target.value })} />
      </label>
      <label className="block text-[11px] text-muted-foreground">Refund / revoke commands
        <textarea rows={2} className={`${input} font-mono text-[11px]`} value={f.revoke} onChange={(e) => setF({ ...f, revoke: e.target.value })} />
      </label>
      <div className="flex items-center gap-4 text-[12px]">
        <label className="flex items-center gap-1"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Most popular</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> On sale</label>
        <button disabled={busy} className={`${btn} ml-auto`} onClick={() =>
          run(() => save({ data: {
            id: p.id, name: f.name, price: Number(f.price), blurb: f.blurb, perks: lines(f.perks),
            rcon_commands: lines(f.rcon), revoke_commands: lines(f.revoke), featured: f.featured, active: f.active,
          } }), `${f.name} saved`, onDone)
        }>Save</button>
      </div>
    </div>
  );
}

const contentFields: [string, string][] = [
  ["brandPrefix", "Brand (first part)"], ["brandSuffix", "Brand (second part)"], ["tagline", "Tagline"],
  ["heroKicker", "Hero small text"], ["heroSubtitle", "Hero subtitle"], ["serverIp", "Server IP"],
  ["version", "Version"], ["playerCount", "Player count"], ["storeTitle", "Store title"],
  ["storeSubtitle", "Store subtitle"], ["footerTagline", "Footer tagline"],
];

function Content({ content, onDone }: { content: Record<string, any>; onDone: () => void }) {
  const save = useServerFn(saveContent);
  const { busy, run } = useAction();
  const [c, setC] = useState<Record<string, any>>({ accent: "purple", ...content, news: { ...(content["news"] ?? {}) } });

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-black">Website Content</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {contentFields.map(([k, label]) => (
          <label key={k} className="block text-[11px] text-muted-foreground">{label}
            <input className={input} value={c[k] ?? ""} onChange={(e) => setC({ ...c, [k]: k === "playerCount" ? Number(e.target.value) || 0 : e.target.value })} />
          </label>
        ))}
        <label className="block text-[11px] text-muted-foreground">Theme colour
          <select className={input} value={c["accent"]} onChange={(e) => setC({ ...c, accent: e.target.value })}>
            <option value="purple">Neon purple</option>
            <option value="emerald">Emerald green</option>
            <option value="cyan">Cyber cyan</option>
          </select>
        </label>
      </div>
      <h3 className="pt-2 font-display font-black">Latest News banner</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {(["tag", "title", "body"] as const).map((k) => (
          <input key={k} className={input} placeholder={k} value={c["news"][k] ?? ""} onChange={(e) => setC({ ...c, news: { ...c["news"], [k]: e.target.value } })} />
        ))}
      </div>
      <button disabled={busy} className={btn} onClick={() => run(() => save({ data: { content: c } }), "Content saved", onDone)}>
        Save content
      </button>
    </div>
  );
}

function Access({ staff, onDone }: { staff: any[]; onDone: () => void }) {
  const setAccess = useServerFn(setEditorAccess);
  const { busy, run } = useAction();
  const [email, setEmail] = useState("");
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-black">Access Management</h2>
      <p className="text-[12px] text-muted-foreground">The person must first create an account on the staff portal, then you can grant them editor access here.</p>
      <div className="flex gap-2">
        <input className={input} type="email" placeholder="staff@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button disabled={busy || !email} className={btn} onClick={() => run(() => setAccess({ data: { email, grant: true } }), "Editor access granted", () => { setEmail(""); onDone(); })}>Grant</button>
      </div>
      <ul className="divide-y divide-border">
        {staff.map((s) => (
          <li key={`${s.userId}-${s.role}`} className="flex items-center justify-between py-2 text-[13px]">
            <span>{s.email ?? s.userId} <span className="ml-2 text-[11px] font-bold text-neon-soft">{s.role}</span></span>
            {s.role === "editor" && s.email && (
              <button disabled={busy} className={`${ghost} text-destructive`} onClick={() => run(() => setAccess({ data: { email: s.email, grant: false } }), "Access revoked", onDone)}>Revoke</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Payments({ cfg, onDone }: { cfg: any; onDone: () => void }) {
  const save = useServerFn(saveRazorpay);
  const { busy, run } = useAction();
  const [f, setF] = useState({ keyId: cfg?.keyId ?? "", keySecret: "", webhookSecret: "", currency: cfg?.currency ?? "INR" });
  if (!cfg) return null;
  const hook = `${window.location.origin}/api/public/razorpay-webhook`;
  const input = "w-full rounded-lg bg-background/60 px-3 py-2 text-[13px]";
  return (
    <div className="mb-8 space-y-3">
      <h2 className="font-display text-xl font-black">Online Payments (Razorpay)</h2>
      <p className="text-[12px] text-muted-foreground">
        Razorpay Dashboard → Account & Settings → API Keys se Key ID aur Key Secret yahan daalein. Webhooks me URL <code className="break-all">{hook}</code> add karein, event "payment.captured" chunein, aur wahi secret yahan daalein. Save ke baad store me payment window khulegi aur paisa aate hi rewards automatic in-game milenge.
      </p>
      <p className="text-[12px]">Status: {cfg.keyId && cfg.hasSecret ? "Connected" : "Not connected"}{cfg.hasWebhook ? " · Webhook set" : ""}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={input} placeholder="Key ID (rzp_live_...)" value={f.keyId} onChange={(e) => setF({ ...f, keyId: e.target.value })} />
        <input className={input} type="password" placeholder={cfg.hasSecret ? "Key Secret (saved — blank = keep)" : "Key Secret"} value={f.keySecret} onChange={(e) => setF({ ...f, keySecret: e.target.value })} />
        <input className={input} type="password" placeholder={cfg.hasWebhook ? "Webhook Secret (saved — blank = keep)" : "Webhook Secret"} value={f.webhookSecret} onChange={(e) => setF({ ...f, webhookSecret: e.target.value })} />
        <input className={input} placeholder="Currency (INR)" maxLength={3} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} />
      </div>
      <button disabled={busy} className={ghost} onClick={() => run(() => save({ data: f }), "Payment settings saved", onDone)}>Save payments</button>
    </div>
  );
}

function Bridge({ token, onDone }: { token: string | null; onDone: () => void }) {
  const rotate = useServerFn(rotateBridgeToken);
  const { busy, run } = useAction();
  const url = `${window.location.origin}/api/public/bridge`;
  const script = `// friendsmp-bridge.mjs  —  run on your Minecraft server machine:
// npm i rcon-client   then   node friendsmp-bridge.mjs
import { Rcon } from "rcon-client";
const API = "${url}";
const TOKEN = "${token ?? "YOUR_DELIVERY_KEY"}";
const RCON = { host: "127.0.0.1", port: 25575, password: "YOUR_RCON_PASSWORD" };

async function tick() {
  const res = await fetch(API, { headers: { "x-bridge-token": TOKEN } });
  if (!res.ok) return console.error("pull failed", res.status);
  const { jobs } = await res.json();
  if (!jobs.length) return;
  const rcon = await Rcon.connect(RCON);
  const results = [];
  for (const j of jobs) {
    try { console.log(">", j.command, await rcon.send(j.command)); results.push({ id: j.id, ok: true }); }
    catch (e) { results.push({ id: j.id, ok: false, error: String(e) }); }
  }
  await rcon.end();
  await fetch(API, { method: "POST", headers: { "x-bridge-token": TOKEN, "content-type": "application/json" }, body: JSON.stringify({ results }) });
}
setInterval(() => tick().catch(console.error), 10000);
tick().catch(console.error);`;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-black">In-game Delivery (RCON Bridge)</h2>
      <p className="text-[12px] text-muted-foreground">
        Enable RCON in server.properties (enable-rcon=true, rcon.password, rcon.port=25575). Run this script on the same machine; every 10 seconds it pulls paid orders and runs the commands, and runs revoke commands after refunds.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-background/60 px-3 py-2 font-mono text-[11px] break-all">{token ?? "—"}</code>
        <button className={ghost} onClick={() => { navigator.clipboard.writeText(script); toast.success("Script copied"); }}>Copy script</button>
        <button disabled={busy} className={`${ghost} text-destructive`} onClick={() => confirm("Old key will stop working. Continue?") && run(() => rotate(), "New delivery key issued", onDone)}>Rotate key</button>
      </div>
      <pre className="max-h-96 overflow-auto rounded-xl bg-background/70 p-4 font-mono text-[11px]">{script}</pre>
    </div>
  );
}

function Audit({ rows }: { rows: any[] }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-xl font-black">Activity Log</h2>
      <ul className="divide-y divide-border text-[12px]">
        {rows.map((r) => (
          <li key={r.id} className="py-2">
            <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span> · {r.actor_email} ·{" "}
            <b>{r.action}</b> · {r.target}
          </li>
        ))}
      </ul>
    </div>
  );
}
