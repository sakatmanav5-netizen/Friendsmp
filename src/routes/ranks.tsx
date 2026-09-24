import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/site/PageShell";
import { ProductGrid } from "@/components/site/ProductGrid";
import { byCategory } from "@/lib/catalog";

export const Route = createFileRoute("/ranks")({
  head: () => ({
    meta: [
      { title: "Ranks — FriendSMP" },
      {
        name: "description",
        content: "VIP, MVP and Legend ranks on FriendSMP. Kits, homes, cosmetics and more.",
      },
      { property: "og:title", content: "FriendSMP Ranks" },
      { property: "og:description", content: "VIP • MVP • Legend — unlock perks on FriendSMP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PageShell
      kicker="RANKS"
      title="Ranks"
      subtitle="VIP • MVP • Legend — permanent perks applied to your account the moment payment clears."
    >
      <ProductGrid items={byCategory("rank")} />
    </PageShell>
  ),
});
