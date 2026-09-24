import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/site/PageShell";
import { ProductGrid } from "@/components/site/ProductGrid";
import { products } from "@/lib/catalog";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Store — FriendSMP" },
      {
        name: "description",
        content:
          "Buy FriendSMP ranks, crate keys and coins. Every purchase is delivered to your Minecraft account automatically.",
      },
      { property: "og:title", content: "FriendSMP Store" },
      {
        property: "og:description",
        content: "Ranks, crate keys and coins with instant in-game delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PageShell
      kicker="SHOP"
      title="Our Store"
      subtitle="Get the best items and support the server. Everything is delivered to your Minecraft account automatically."
    >
      <ProductGrid items={products} />
    </PageShell>
  ),
});
