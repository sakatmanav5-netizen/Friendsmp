import { useEffect, useState } from "react";
import { getLiveServerStatus, type LiveServerStatus } from "@/lib/server-status.functions";

// players/maxPlayers start at -1 = "not fetched yet"; components should fall
// back to the owner-edited content.playerCount until the first tick resolves.
const FALLBACK: LiveServerStatus = {
  online: true,
  players: -1,
  maxPlayers: -1,
  motd: "",
  version: "",
  source: "fallback",
};

export const liveStatus: LiveServerStatus = { ...FALLBACK };

let started = false;
const listeners = new Set<() => void>();

async function tick() {
  try {
    const s = await getLiveServerStatus();
    Object.assign(liveStatus, s);
    listeners.forEach((l) => l());
  } catch {
    /* keep last known status on a transient failure */
  }
}

function start() {
  if (started) return;
  started = true;
  void tick();
  setInterval(tick, 30000);
}

/** Live server status (online/offline, players, MOTD, version); polls every 30s. */
export function useLiveServerStatus() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    start();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return liveStatus;
}
