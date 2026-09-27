import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, UploadCloud } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { saveDesign, saveMedia, saveSocial, saveServerStatus } from "@/lib/admin.functions";
import { getLiveServerStatus } from "@/lib/server-status.functions";
import { defaultDesign, withDesignDefaults, type SiteDesign } from "@/lib/design-tokens";

const input =
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const btn = "rounded-full btn-neon px-4 py-2 text-xs font-bold disabled:opacity-50";
const label = "block text-[11px] font-bold text-muted-foreground";

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

/* ===================== Visual Website Builder ===================== */

const CARD_LABEL: Record<string, string> = { ranks: "Ranks", crates: "Crate Keys", coins: "Coins" };

export function Design({ design: raw, onDone }: { design: Partial<SiteDesign>; onDone: () => void }) {
  const [d, setD] = useState<SiteDesign>(withDesignDefaults(raw));
  const save = useServerFn(saveDesign);
  const { busy, run } = useAction();

  const move = (i: number, dir: -1 | 1) => {
    const order = [...d.homeCardOrder];
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j]!, order[i]!];
    setD({ ...d, homeCardOrder: order });
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h3 className="font-display text-lg font-black">Visual Website Builder</h3>
        <p className="text-[12px] text-muted-foreground">
          Changes apply live across the whole site — colours, glow, card size and footer spacing all read from
          these same settings.
        </p>
      </div>

      <div>
        <label className={label}>Brand hue ({d.hue}°) — recolours primary/neon, buttons, navbar</label>
        <input
          type="range"
          min={0}
          max={360}
          value={d.hue}
          onChange={(e) => setD({ ...d, hue: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div
          className="mt-2 h-8 w-full rounded-lg"
          style={{ background: `linear-gradient(135deg, oklch(0.58 0.25 ${d.hue}), oklch(0.68 0.2 ${d.hue - 25}))` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Card / panel radius ({d.radius.toFixed(2)}rem)</label>
          <input
            type="range"
            min={0.3}
            max={1.6}
            step={0.05}
            value={d.radius}
            onChange={(e) => setD({ ...d, radius: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className={label}>Glow intensity</label>
          <select className={input} value={d.glow} onChange={(e) => setD({ ...d, glow: e.target.value as SiteDesign["glow"] })}>
            <option value="subtle">Subtle</option>
            <option value="normal">Normal</option>
            <option value="intense">Intense</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Homepage card height ({d.cardMinHeight}px)</label>
          <input
            type="range"
            min={220}
            max={420}
            step={10}
            value={d.cardMinHeight}
            onChange={(e) => setD({ ...d, cardMinHeight: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className={label}>Footer spacing</label>
          <select
            className={input}
            value={d.footerSpacing}
            onChange={(e) => setD({ ...d, footerSpacing: e.target.value as SiteDesign["footerSpacing"] })}
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="roomy">Roomy</option>
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Homepage store card order</label>
        <div className="mt-2 space-y-2">
          {d.homeCardOrder.map((key, i) => (
            <div key={key} className="flex items-center justify-between rounded-xl bg-accent/60 px-3 py-2">
              <span className="text-sm font-semibold">{CARD_LABEL[key] ?? key}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-background/60 disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={i === d.homeCardOrder.length - 1}
                  onClick={() => move(i, 1)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-background/60 disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => run(() => save({ data: { design: d } }), "Design saved", onDone)}
          className={btn}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save design"}
        </button>
        <button
          type="button"
          onClick={() => setD(defaultDesign)}
          className="rounded-full bg-accent px-4 py-2 text-xs font-bold hover:bg-accent/70"
        >
          Reset to default
        </button>
      </div>
    </div>
  );
}

/* ===================== Media Manager ===================== */

type MediaState = {
  heroImage?: string;
  logoImage?: string;
  cardImages?: { ranks?: string; crates?: string; coins?: string };
};

function UploadField({
  currentUrl,
  label: fieldLabel,
  path,
  onUploaded,
}: {
  currentUrl?: string;
  label: string;
  path: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const key = `${path}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-media").upload(key, file, { upsert: true });
      if (error) throw error;
      const signed = await supabase.storage
        .from("site-media")
        .createSignedUrl(key, 60 * 60 * 24 * 365 * 10);
      if (signed.error) throw signed.error;
      onUploaded(signed.data.signedUrl);
      toast.success(`${fieldLabel} uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-accent/40 p-3">
      <label className={label}>{fieldLabel}</label>
      <div className="mt-2 flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-background/60">
          {currentUrl ? (
            <img src={currentUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UploadCloud className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <label className="cursor-pointer rounded-full bg-background/60 px-3 py-1.5 text-[11px] font-bold hover:bg-background/80">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : currentUrl ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pick(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function Media({ media: raw, onDone }: { media: MediaState; onDone: () => void }) {
  const [m, setM] = useState<MediaState>({ cardImages: {}, ...raw });
  const save = useServerFn(saveMedia);
  const { busy, run } = useAction();

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h3 className="font-display text-lg font-black">Media Manager</h3>
        <p className="text-[12px] text-muted-foreground">
          Upload images straight to storage — the homepage, sidebar and store cards update instantly once saved.
        </p>
      </div>

      <UploadField label="Hero banner" currentUrl={m.heroImage} path="hero" onUploaded={(url) => setM({ ...m, heroImage: url })} />
      <UploadField label="Logo" currentUrl={m.logoImage} path="logo" onUploaded={(url) => setM({ ...m, logoImage: url })} />
      <UploadField
        label="Ranks card image"
        currentUrl={m.cardImages?.ranks}
        path="card-ranks"
        onUploaded={(url) => setM({ ...m, cardImages: { ...m.cardImages, ranks: url } })}
      />
      <UploadField
        label="Crate Keys card image"
        currentUrl={m.cardImages?.crates}
        path="card-crates"
        onUploaded={(url) => setM({ ...m, cardImages: { ...m.cardImages, crates: url } })}
      />
      <UploadField
        label="Coins card image"
        currentUrl={m.cardImages?.coins}
        path="card-coins"
        onUploaded={(url) => setM({ ...m, cardImages: { ...m.cardImages, coins: url } })}
      />

      <button disabled={busy} onClick={() => run(() => save({ data: { media: m } }), "Media saved", onDone)} className={btn}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save media"}
      </button>
    </div>
  );
}

/* ===================== Social Links Manager ===================== */

type SocialState = { discord?: string; instagram?: string; youtube?: string; telegram?: string };

export function Social({ social: raw, onDone }: { social: SocialState; onDone: () => void }) {
  const [s, setS] = useState<SocialState>(raw ?? {});
  const save = useServerFn(saveSocial);
  const { busy, run } = useAction();

  const field = (key: keyof SocialState, placeholder: string) => (
    <div>
      <label className={label}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
      <input
        className={input}
        placeholder={placeholder}
        value={s[key] ?? ""}
        onChange={(e) => setS({ ...s, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="max-w-xl space-y-3">
      <div>
        <h3 className="font-display text-lg font-black">Social Links</h3>
        <p className="text-[12px] text-muted-foreground">
          Feeds the footer icons on every page. Leave blank to keep an icon inactive.
        </p>
      </div>
      {field("discord", "https://discord.gg/...")}
      {field("instagram", "https://instagram.com/...")}
      {field("youtube", "https://youtube.com/@...")}
      {field("telegram", "https://t.me/...")}
      <button disabled={busy} onClick={() => run(() => save({ data: s }), "Social links saved", onDone)} className={btn}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save social links"}
      </button>
    </div>
  );
}

/* ===================== Live Server Status ===================== */

type StatusState = {
  mode?: "live" | "manual";
  manualOnline?: boolean;
  manualPlayers?: number;
  manualMaxPlayers?: number;
  manualMotd?: string;
  manualVersion?: string;
};

export function ServerStatusPanel({ status: raw, onDone }: { status: StatusState; onDone: () => void }) {
  const [s, setS] = useState<StatusState>({ mode: "live", manualOnline: true, manualPlayers: 0, manualMaxPlayers: 100, manualMotd: "", manualVersion: "", ...raw });
  const save = useServerFn(saveServerStatus);
  const { busy, run } = useAction();
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof getLiveServerStatus>> | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setChecking(true);
    getLiveServerStatus()
      .then(setPreview)
      .finally(() => setChecking(false));
  }, []);

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h3 className="font-display text-lg font-black">Live Server Status</h3>
        <p className="text-[12px] text-muted-foreground">
          "Live" pings your server IP (from Content → Server IP) for real online status, player count, MOTD and
          version. Switch to "Manual" to set these yourself instead.
        </p>
      </div>

      <div className="rounded-xl bg-accent/40 p-3 text-[12px]">
        {checking ? (
          <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking current status…</span>
        ) : preview ? (
          <div className="space-y-1">
            <p><span className="font-bold">Currently showing:</span> {preview.online ? "Online" : "Offline"} · {preview.players} players · v{preview.version || "—"}</p>
            {preview.motd && <p className="text-muted-foreground">MOTD: {preview.motd}</p>}
            <p className="text-[10px] text-muted-foreground">Source: {preview.source}</p>
          </div>
        ) : null}
      </div>

      <div>
        <label className={label}>Mode</label>
        <select className={input} value={s.mode} onChange={(e) => setS({ ...s, mode: e.target.value as StatusState["mode"] })}>
          <option value="live">Live (ping the real server)</option>
          <option value="manual">Manual override</option>
        </select>
      </div>

      {s.mode === "manual" && (
        <div className="space-y-3 rounded-xl bg-accent/30 p-3">
          <label className="flex items-center gap-2 text-[12px] font-semibold">
            <input type="checkbox" checked={!!s.manualOnline} onChange={(e) => setS({ ...s, manualOnline: e.target.checked })} />
            Server online
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Player count</label>
              <input type="number" min={0} className={input} value={s.manualPlayers} onChange={(e) => setS({ ...s, manualPlayers: Number(e.target.value) })} />
            </div>
            <div>
              <label className={label}>Max players</label>
              <input type="number" min={0} className={input} value={s.manualMaxPlayers} onChange={(e) => setS({ ...s, manualMaxPlayers: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className={label}>MOTD</label>
            <input className={input} value={s.manualMotd} onChange={(e) => setS({ ...s, manualMotd: e.target.value })} />
          </div>
          <div>
            <label className={label}>Version</label>
            <input className={input} value={s.manualVersion} onChange={(e) => setS({ ...s, manualVersion: e.target.value })} />
          </div>
        </div>
      )}

      <button
        disabled={busy}
        onClick={() =>
          run(
            () =>
              save({
                data: {
                  mode: s.mode ?? "live",
                  manualOnline: !!s.manualOnline,
                  manualPlayers: s.manualPlayers ?? 0,
                  manualMaxPlayers: s.manualMaxPlayers ?? 0,
                  manualMotd: s.manualMotd ?? "",
                  manualVersion: s.manualVersion ?? "",
                },
              }),
            "Server status saved",
            onDone,
          )
        }
        className={btn}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save status settings"}
      </button>
    </div>
  );
}
