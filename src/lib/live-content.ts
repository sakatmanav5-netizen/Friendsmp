import { useEffect, useState } from "react";
import { defaultContent, type SiteContent } from "@/lib/site-content";
import { getSiteData } from "@/lib/public.functions";

/** Shared, mutable copy of the owner-edited content (filled after first fetch). */
export const liveContent: SiteContent & { accent?: string } = { ...defaultContent };

let loaded = false;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  if (!pending) {
    pending = getSiteData()
      .then((d) => {
        Object.assign(liveContent, d.content);
        loaded = true;
        listeners.forEach((l) => l());
      })
      .catch(() => {
        pending = null;
      });
  }
  return pending;
}

/** Returns saved site content; re-renders once the latest values arrive. */
export function useLiveContent() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    if (!loaded) void load();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return liveContent;
}
