import { createFileRoute } from "@tanstack/react-router";

import { PageShell, copyServerIp } from "@/components/site/PageShell";
import { useLiveContent } from "@/lib/live-content";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — FriendSMP" },
      {
        name: "description",
        content:
          "FriendSMP is a premium Minecraft survival network built around a friendly community, no lag and active staff.",
      },
      { property: "og:title", content: "About FriendSMP" },
      {
        property: "og:description",
        content: "A premium survival network on Minecraft 1.20.4 — join at play.friendsmp.in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const c = useLiveContent();
  return (
    <PageShell
      kicker="ABOUT"
      title="About FriendSMP"
      subtitle="A premium survival network built for players who want to stay."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-3xl glass p-6 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            FriendSMP started as a small survival world between friends and grew into a full network.
            We keep it simple: vanilla-feeling survival, quality-of-life plugins, and zero
            pay-to-win nonsense. Ranks, crate keys and coins support the server and unlock cosmetics
            and convenience — never raw power.
          </p>
          <p className="mt-3">
            The server runs on high-frequency hardware with daily backups, so your builds are safe.
            Staff are active every day across timezones, and every report is handled in-game.
          </p>
        </div>
        <div className="rounded-3xl glass neon-ring p-6">
          <h2 className="font-display text-lg font-black">Server details</h2>
          <dl className="mt-3 space-y-3 text-[13px]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <dt className="text-muted-foreground">IP</dt>
              <dd className="truncate font-bold">{c.serverIp}</dd>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-bold">{c.version}</dd>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <dt className="text-muted-foreground">Players online</dt>
              <dd className="font-bold">{c.playerCount}</dd>
            </div>
          </dl>
          <button
            onClick={copyServerIp}
            className="mt-5 w-full rounded-full btn-neon px-4 py-3 text-sm font-bold"
          >
            Copy IP
          </button>
        </div>
      </div>
    </PageShell>
  );
}
