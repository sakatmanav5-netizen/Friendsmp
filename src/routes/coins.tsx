import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/site/PageShell";
import { ProductGrid } from "@/components/site/ProductGrid";
import { byCategory } from "@/lib/catalog";

export const Route = createFileRoute("/coins")({
  head: () => ({
    meta: [
      { title: "Coins — FriendSMP" },
      {
        name: "description",
        content: "Top up 100, 500 or 1000 FriendSMP coins and spend them in the in-game shop.",
      },
      { property: "og:title", content: "FriendSMP Coins" },
      { property: "og:description", content: "100 • 500 • 1000 coin packs with bonus coins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PageShell
      kicker="COINS"
      title="Coins"
      subtitle="100 • 500 • 1000 packs — spend coins on the in-game shop, auctions and cosmetics."
    >
      <ProductGrid items={byCategory("coins")} />
    </PageShell>
  ),
});
