export type Product = {
  id: string;
  category: "rank" | "crate" | "coins";
  name: string;
  price: number;
  blurb: string;
  perks: string[];
  featured?: boolean;
};

/** Store catalog. Each product maps to RCON commands on delivery. */
export const products: Product[] = [
  {
    id: "rank-vip",
    category: "rank",
    name: "VIP",
    price: 4.99,
    blurb: "Get started with the essentials.",
    perks: ["/kit vip", "Colored chat", "2 home slots", "VIP tag"],
  },
  {
    id: "rank-mvp",
    category: "rank",
    name: "MVP",
    price: 9.99,
    blurb: "The community favourite.",
    perks: ["/kit mvp", "/fly in spawn", "5 home slots", "Particle trails"],
    featured: true,
  },
  {
    id: "rank-legend",
    category: "rank",
    name: "Legend",
    price: 19.99,
    blurb: "Everything the server has to offer.",
    perks: ["/kit legend", "10 home slots", "Custom nickname", "Priority queue"],
  },
  {
    id: "crate-epic",
    category: "crate",
    name: "Epic Key",
    price: 2.49,
    blurb: "High-tier loot, enchanted gear and rare cosmetics.",
    perks: ["1 Epic crate key", "Enchanted gear pool", "Rare cosmetics"],
    featured: true,
  },
  {
    id: "crate-vote",
    category: "crate",
    name: "Vote Key",
    price: 0.99,
    blurb: "Everyday loot for everyday grinders.",
    perks: ["3 Vote crate keys", "Resource rewards", "Coin bonuses"],
  },
  {
    id: "crate-monthly",
    category: "crate",
    name: "Monthly Key",
    price: 6.99,
    blurb: "Limited seasonal rewards you can't get anywhere else.",
    perks: ["1 Monthly crate key", "Seasonal cosmetics", "Exclusive pets"],
  },
  {
    id: "coins-100",
    category: "coins",
    name: "100 Coins",
    price: 1.99,
    blurb: "A small top-up for the in-game shop.",
    perks: ["100 server coins"],
  },
  {
    id: "coins-500",
    category: "coins",
    name: "500 Coins",
    price: 7.99,
    blurb: "Best value for regular players.",
    perks: ["500 server coins", "+50 bonus coins"],
    featured: true,
  },
  {
    id: "coins-1000",
    category: "coins",
    name: "1000 Coins",
    price: 14.99,
    blurb: "Stock up and never think about it again.",
    perks: ["1000 server coins", "+150 bonus coins"],
  },
];

export const byCategory = (category: Product["category"]) =>
  products.filter((p) => p.category === category);

export const findProduct = (id: string) => products.find((p) => p.id === id);
