import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { defaultContent } from "@/lib/site-content";

/**
 * New module: Live Server Status.
 * Does not touch orders/products/content — reads the same `site_settings`
 * table the rest of the app already uses, under its own "server_status" key.
 */

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type LiveServerStatus = {
  online: boolean;
  players: number;
  maxPlayers: number;
  motd: string;
  version: string;
  source: "live" | "manual" | "fallback";
};

type ManualStatus = {
  mode?: "live" | "manual";
  manualOnline?: boolean;
  manualPlayers?: number;
  manualMaxPlayers?: number;
  manualMotd?: string;
  manualVersion?: string;
};

export const getLiveServerStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveServerStatus> => {
    const supabase = publicClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["content", "server_status"]);

    const map = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
    const content = (map["content"] ?? {}) as { serverIp?: string; playerCount?: number; version?: string };
    const manual = (map["server_status"] ?? {}) as ManualStatus;

    const fallback: LiveServerStatus = {
      online: true,
      players: content.playerCount ?? defaultContent.playerCount,
      maxPlayers: Math.max(100, content.playerCount ?? defaultContent.playerCount),
      motd: "Welcome to the server!",
      version: content.version ?? defaultContent.version,
      source: "fallback",
    };

    if (manual.mode === "manual") {
      return {
        online: manual.manualOnline ?? true,
        players: manual.manualPlayers ?? fallback.players,
        maxPlayers: manual.manualMaxPlayers ?? fallback.maxPlayers,
        motd: manual.manualMotd || fallback.motd,
        version: manual.manualVersion || fallback.version,
        source: "manual",
      };
    }

    const ip = content.serverIp?.trim();
    if (!ip) return fallback;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(ip)}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return fallback;

      const json = (await res.json()) as {
        online?: boolean;
        players?: { online?: number; max?: number };
        motd?: { clean?: string[] };
        version?: string;
      };

      if (!json.online) {
        return { ...fallback, online: false, players: 0, motd: "Server offline", source: "live" };
      }

      return {
        online: true,
        players: json.players?.online ?? fallback.players,
        maxPlayers: json.players?.max ?? fallback.maxPlayers,
        motd: json.motd?.clean?.join(" ") || fallback.motd,
        version: json.version || fallback.version,
        source: "live",
      };
    } catch {
      return fallback;
    }
  },
);
