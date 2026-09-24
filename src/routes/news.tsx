import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/site/PageShell";
import newsArt from "@/assets/news-xp.jpg";

const posts = [
  {
    tag: "EVENT",
    title: "Double XP Weekend",
    body: "This weekend enjoy 2x XP on our server! Don't miss it — the boost runs from Friday 18:00 to Sunday midnight.",
    date: "This weekend",
    art: newsArt,
  },
  {
    tag: "UPDATE",
    title: "Season 4 map expansion",
    body: "The world border moved out another 5,000 blocks with fresh biomes, new villages and three hidden dungeons.",
    date: "Last week",
  },
  {
    tag: "STORE",
    title: "Monthly crate refreshed",
    body: "New seasonal cosmetics, two exclusive pets and a reworked loot table are live in the Monthly crate.",
    date: "Earlier this month",
  },
];

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News — FriendSMP" },
      {
        name: "description",
        content: "Events, updates and store news from the FriendSMP Minecraft survival network.",
      },
      { property: "og:title", content: "FriendSMP News" },
      { property: "og:description", content: "Double XP weekends, map expansions and crate drops." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PageShell
      kicker="NEWS"
      title="Latest News"
      subtitle="Everything happening on the server, straight from the staff team."
    >
      <div className="grid gap-4">
        {posts.map((p) => (
          <article key={p.title} className="overflow-hidden rounded-3xl glass">
            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_34%]">
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-black tracking-widest text-neon-soft">
                    {p.tag}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{p.date}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-black tracking-tight">{p.title}</h2>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{p.body}</p>
              </div>
              {p.art && (
                <div className="relative min-h-[140px]">
                  <img
                    src={p.art}
                    alt={p.title}
                    loading="lazy"
                    width={1200}
                    height={608}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  ),
});
