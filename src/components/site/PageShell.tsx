import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Copy, Globe, Menu, Play } from "lucide-react";
import { toast } from "sonner";

import { Sidebar } from "@/components/site/Sidebar";
import { liveContent as c, useLiveContent } from "@/lib/live-content";
import { useLiveServerStatus } from "@/lib/live-status";

export function copyServerIp() {
  void navigator.clipboard?.writeText(c.serverIp).catch(() => {});
  toast.success("IP Copied!", { description: c.serverIp });
}

export function PageShell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  useLiveContent();
  const status = useLiveServerStatus();
  const players = status.players >= 0 ? status.players : c.playerCount;
  const online = status.players >= 0 ? status.online : true;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen canvas-glow bg-background">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} brandPrefix={c.brandPrefix} brandSuffix={c.brandSuffix} />
      <main className="lg:pl-[228px]">
        <div className="mx-auto max-w-[1180px] px-3 py-4 sm:px-5 sm:py-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl glass lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex min-w-0 items-center gap-2 rounded-full glass px-3 py-2" title={status.motd || undefined}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-online pulse-dot" : "bg-destructive"}`} />
                <span className="truncate text-[11px] font-semibold sm:text-xs">
                  {online ? "Server Online" : "Server Offline"}
                </span>
                <span className="h-3 w-px shrink-0 bg-border" />
                <span className="truncate text-[11px] font-semibold text-muted-foreground sm:text-xs">
                  {players} Players
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={copyServerIp}
                aria-label="Copy server IP"
                className="grid h-9 w-9 place-items-center rounded-full glass"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <span className="hidden h-9 w-9 place-items-center rounded-full glass sm:grid">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </span>
              <Link
                to="/store"
                className="flex items-center gap-2 rounded-full btn-neon px-4 py-2.5 text-xs font-bold"
              >
                <Play className="h-3.5 w-3.5" />
                Join Server
              </Link>
            </div>
          </div>

          <header className="mt-7">
            {kicker && (
              <span className="inline-flex rounded-full bg-accent px-3 py-1 text-[10px] font-bold tracking-widest text-neon-soft">
                {kicker}
              </span>
            )}
            <h1 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-5xl">
              {title}
            </h1>
            {subtitle && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>}
          </header>

          <div className="mt-7 pb-10">{children}</div>
        </div>
      </main>
    </div>
  );
}
