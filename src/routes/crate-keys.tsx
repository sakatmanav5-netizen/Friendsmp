import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/site/PageShell";
import { ProductGrid } from "@/components/site/ProductGrid";
import { byCategory } from "@/lib/catalog";

export const Route = createFileRoute("/crate-keys")({
  head: () => ({
    meta: [
      { title: "Crate Keys — EliteMC" },
      {
        name: "description",
        content: "Epic, Vote and Monthly crate keys on EliteMC with instant in-game delivery.",
      },
      { property: "og:title", content: "EliteMC Crate Keys" },
      { property: "og:description", content: "Epic • Vote • Monthly keys full of rare loot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PageShell
      kicker="CRATES"
      title="Crate Keys"
      subtitle="Epic • Vote • Monthly — keys land in your inventory as soon as you join the server."
    >
      <ProductGrid items={byCategory("crate")} />
    </PageShell>
  ),
});
