/**
 * Default site content. The hidden owner CMS overrides these values and
 * persists them; this object is the fallback shown to every visitor.
 */
export type SiteContent = {
  brandPrefix: string;
  brandSuffix: string;
  tagline: string;
  heroKicker: string;
  heroSubtitle: string;
  serverIp: string;
  version: string;
  playerCount: number;
  storeKicker: string;
  storeTitle: string;
  storeSubtitle: string;
  news: { tag: string; title: string; body: string };
  footerTagline: string;
};

export const defaultContent: SiteContent = {
  brandPrefix: "Friend",
  brandSuffix: "SMP",
  tagline: "The Ultimate Minecraft Survival Experience",
  heroKicker: "Welcome to",
  heroSubtitle:
    "Join our growing community, explore, build, and become the best player on the server!",
  serverIp: "play.friendsmp.in",
  version: "1.20.4",
  playerCount: 247,
  storeKicker: "SHOP",
  storeTitle: "Our Store",
  storeSubtitle: "Get the best items and support the server!",
  news: {
    tag: "EVENT",
    title: "Double XP Weekend",
    body: "This weekend enjoy 2x XP on our server! Don't miss it!",
  },
  footerTagline: "Premium Survival Network",
};

export const perks = ["Survival", "Active Staff", "No Lag", "Friendly Community"];
