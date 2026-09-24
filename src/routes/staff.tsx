import { createFileRoute } from "@tanstack/react-router";
import { Crown, Shield, Wrench } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";

const team = [
  { name: "Rashi", role: "Owner", icon: Crown, note: "Runs the network and handles payments." },
  { name: "Aarav", role: "Admin", icon: Shield, note: "Moderation, appeals and events." },
  { name: "Kabir", role: "Developer", icon: Wrench, note: "Plugins, performance and the store." },
  { name: "Meera", role: "Moderator", icon: Shield, note: "In-game support and chat moderation." },
];

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff — FriendSMP" },
      {
        name: "description",
        content: "Meet the FriendSMP staff team — owners, admins, developers and moderators.",
      },
      { property: "og:title", content: "FriendSMP Staff Team" },
      { property: "og:description", content: "The people keeping FriendSMP friendly and lag-free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PageShell
      kicker="TEAM"
      title="Staff"
      subtitle="Active, friendly and always online — here's who keeps the server running."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {team.map(({ name, role, icon: Icon, note }) => (
          <div key={name} className="rounded-3xl glass p-5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl btn-neon">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <h2 className="mt-3 font-display text-lg font-black">{name}</h2>
            <p className="text-[11px] font-bold text-neon-soft">{role}</p>
            <p className="mt-2 text-[12px] text-muted-foreground">{note}</p>
          </div>
        ))}
      </div>
    </PageShell>
  ),
});
