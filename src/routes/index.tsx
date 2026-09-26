import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Copy,
  Crown,
  Flame,
  Globe,
  Heart,
  Instagram,
  Megaphone,
  Menu,
  Play,
  ShieldCheck,
  Users,
  Youtube,
  Zap,
} from "lucide-react";

import hero from "@/assets/hero-castle.jpg";
import cardRanks from "@/assets/card-ranks.jpg";
import cardCrates from "@/assets/card-crates.jpg";
import cardCoins from "@/assets/card-coins.jpg";
import newsArt from "@/assets/news-xp.jpg";
import { Sidebar } from "@/components/site/Sidebar";
import { PlayersWave } from "@/components/site/PlayersWave";
import { perks } from "@/lib/site-content";
import { useLiveContent } from "@/lib/live-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FriendSMP — The Ultimate Minecraft Survival Experience" },
      {
        name: "description",
        content:
          "Join FriendSMP, a premium Minecraft survival network. Grab ranks, crate keys and coins, and play with a friendly community at play.friendsmp.in.",
      },
      { property: "og:title", content: "FriendSMP — Premium Minecraft Survival Network" },
      {
        property: "og:description",
        content:
          "Ranks, crate keys and coins delivered instantly in-game. 247 players online right now.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const perkIcons = [Flame, ShieldCheck, Zap, Heart];

function Home() {
  const c = useLiveContent();
  const [menuOpen, setMenuOpen] = useState(false);

  const copyIp = async () => {
    try {
      await navigator.clipboard.writeText(c.serverIp);
    } catch {
      /* clipboard blocked — still confirm the IP to the player */
    }
    toast.custom(() => (
      <div className="flex items-center gap-3 rounded-2xl glass neon-ring px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full btn-neon">
          <Check className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold">IP Copied!</span>
          <span className="block truncate text-xs text-muted-foreground">{c.serverIp}</span>
        </span>
      </div>
    ));
  };

  return (
    <div className="min-h-screen canvas-glow bg-background">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="lg:pl-[228px]">
        <div className="mx-auto max-w-[1180px] px-3 py-4 sm:px-5 sm:py-6">
          {/* ===== HERO ===== */}
          <section className="relative overflow-hidden rounded-3xl neon-ring">
            <img
              src={hero}
              alt="FriendSMP purple castle world"
              width={1600}
              height={912}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(100deg, oklch(0.05 0.03 300 / 96%) 8%, oklch(0.08 0.05 300 / 72%) 45%, oklch(0.1 0.06 300 / 35%) 100%)",
              }}
            />

            <div className="relative p-4 sm:p-6">
              {/* top bar */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl glass lg:hidden"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  <div className="flex min-w-0 items-center gap-2 rounded-full glass px-3 py-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-online pulse-dot" />
                    <span className="truncate text-[11px] font-semibold sm:text-xs">
                      Server Online
                    </span>
                    <span className="h-3 w-px shrink-0 bg-border" />
                    <span className="truncate text-[11px] font-semibold text-muted-foreground sm:text-xs">
                      {c.playerCount} Players
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
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

              {/* hero body */}
              <div className="mt-8 grid gap-6 pb-2 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
                    <Crown className="h-4 w-4 text-gold" />
                    {c.heroKicker}
                  </div>
                  <h1 className="mt-1 font-display text-[44px] leading-[1.02] font-black tracking-tight sm:text-6xl lg:text-7xl">
                    {c.brandPrefix}
                    <span className="text-neon-soft text-glow">{c.brandSuffix}</span>
                  </h1>
                  <p className="mt-2 font-display text-base font-bold sm:text-lg">{c.tagline}</p>
                  <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                    {c.heroSubtitle}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      to="/store"
                      className="rounded-full btn-neon px-6 py-3 text-sm font-bold"
                    >
                      Join Now
                    </Link>
                    <button
                      onClick={copyIp}
                      className="flex items-center gap-2 rounded-full glass px-5 py-3 text-sm font-bold transition-colors hover:bg-accent"
                    >
                      Copy IP
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {perks.map((p, i) => {
                      const Icon = perkIcons[i % perkIcons.length]!;
                      return (
                        <span
                          key={p}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"
                        >
                          <Icon className="h-3.5 w-3.5 text-neon-soft" />
                          {p}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* live players box */}
                <div className="w-full max-w-[220px] float-slow">
                  <div className="rounded-2xl glass neon-ring p-4">
                    <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      Live Players
                    </div>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <span className="font-display text-3xl font-black leading-none">
                        {c.playerCount}
                      </span>
                      <PlayersWave className="h-11 w-[110px]" />
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl glass p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground">Server IP</div>
                    <div className="mt-0.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <span className="truncate text-xs font-bold">{c.serverIp}</span>
                      <button
                        onClick={copyIp}
                        aria-label="Copy server IP"
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent transition-colors hover:bg-primary"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== STORE ===== */}
          <section className="mt-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-bold tracking-widest text-neon-soft">
              <Crown className="h-3 w-3" />
              {c.storeKicker}
            </span>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                  {c.storeTitle}
                </h2>
                <p className="mt-1 text-[13px] text-muted-foreground">{c.storeSubtitle}</p>
              </div>
              <Link
                to="/store"
                className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-neon-soft hover:underline"
              >
                View All Items <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StoreCard
                image={cardRanks}
                ring="neon-ring"
                badge="Most Popular"
                title="Ranks"
                items="VIP • MVP • Legend"
                cta="Explore"
                to="/ranks"
              />
              <StoreCard
                image={cardCrates}
                ring="cyan-ring"
                title="Crate Keys"
                items="Epic • Vote • Monthly"
                cta="View Keys"
                to="/crate-keys"
              />
              <StoreCard
                image={cardCoins}
                ring="gold-ring"
                title="Coins"
                items="100 • 500 • 1000"
                cta="Buy Coins"
                to="/coins"
              />
            </div>
          </section>

          {/* ===== NEWS ===== */}
          <section className="mt-8 overflow-hidden rounded-3xl glass neon-ring">
            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_42%]">
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg btn-neon">
                    <Megaphone className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold">Latest News</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-black tracking-widest text-neon-soft">
                    {c.news.tag}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">
                  Double <span className="text-neon-soft text-glow">XP</span> Weekend
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{c.news.body}</p>
                <Link
                  to="/news"
                  className="mt-5 inline-flex items-center gap-2 rounded-full btn-neon px-4 py-2.5 text-xs font-bold"
                >
                  Read More <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="relative min-h-[150px]">
                <img
                  src={newsArt}
                  alt="Double XP weekend event"
                  loading="lazy"
                  width={1200}
                  height={608}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.08 0.04 300 / 95%), oklch(0.08 0.04 300 / 10%))",
                  }}
                />
                <div className="absolute inset-0 grid place-items-center p-4">
                  <span className="font-display text-2xl leading-none font-black tracking-tight uppercase sm:text-3xl">
                    <span className="block">Double XP</span>
                    <span className="block text-cyan text-glow">Weekend</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ===== FOOTER ===== */}
          <footer className="mt-6 mb-2 rounded-3xl glass px-5 py-4">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl btn-neon">
                    <Crown className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-xs font-extrabold">
                      {c.brandPrefix}
                      <span className="text-neon-soft">{c.brandSuffix}</span>
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {c.footerTagline}
                    </span>
                  </span>
                </div>
                <FooterStat label="Server IP" value={c.serverIp} onCopy={copyIp} />
                <FooterStat label="Online Players" value={String(c.playerCount)} />
                <FooterStat label="Version" value={c.version} />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {[Megaphone, Youtube, Instagram, Globe].map((Icon, i) => (
                  <span
                    key={i}
                    className="grid h-8 w-8 place-items-center rounded-full bg-accent text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

function FooterStat({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-neon-soft">
        <Users className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[10px] text-muted-foreground">{label}</span>
        <span className="flex items-center gap-1.5">
          <span className="truncate text-xs font-bold">{value}</span>
          {onCopy && (
            <button onClick={onCopy} aria-label="Copy server IP" className="shrink-0">
              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </span>
      </span>
    </div>
  );
}

function StoreCard({
  image,
  ring,
  badge,
  title,
  items,
  cta,
  to,
}: {
  image: string;
  ring: string;
  badge?: string;
  title: string;
  items: string;
  cta: string;
  to: string;
}) {
  return (
    <div
      className={`group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl ${ring} transition-transform duration-300 hover:-translate-y-1`}
    >
      <img
        src={image}
        alt={title}
        loading="lazy"
        width={800}
        height={912}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, oklch(0.06 0.03 300 / 97%) 22%, oklch(0.08 0.04 300 / 55%) 55%, transparent 100%)",
        }}
      />
      <div className="relative p-5">
        {badge && (
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[10px] font-bold">
            <Crown className="h-3 w-3 text-gold" />
            {badge}
          </span>
        )}
        <h3 className="font-display text-2xl font-black tracking-tight">{title}</h3>
        <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{items}</p>
        <Link
          to={to}
          className="mt-4 inline-flex items-center gap-2 rounded-full btn-neon px-4 py-2 text-[11px] font-bold"
        >
          {cta} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
