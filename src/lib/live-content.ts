import { useEffect, useState } from "react";
import { defaultContent, type SiteContent } from "@/lib/site-content";
import { getSiteData } from "@/lib/public.functions";
import { defaultDesign, withDesignDefaults, type SiteDesign } from "@/lib/design-tokens";

/** Shared, mutable copy of the owner-edited content (filled after first fetch). */
export const liveContent: SiteContent & { accent?: string } = { ...defaultContent };

/** New modules' data — design tokens, social links, media URLs — fetched
 * from the same getSiteData() call so there's no extra round trip. */
export type LiveExtras = {
  design: SiteDesign;
  social: { discord?: string; instagram?: string; youtube?: string; telegram?: string };
  media: { heroImage?: string; logoImage?: string; cardImages?: Partial<Record<"ranks" | "crates" | "coins", string>> };
};
export const liveExtras: LiveExtras = { design: defaultDesign, social: {}, media: {} };

let loaded = false;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  if (!pending) {
    pending = getSiteData()
      .then((d) => {
        Object.assign(liveContent, d.content);
        liveExtras.design = withDesignDefaults(d.design as Partial<SiteDesign>);
        liveExtras.social = (d.social ?? {}) as LiveExtras["social"];
        liveExtras.media = (d.media ?? {}) as LiveExtras["media"];
        loaded = true;
        listeners.forEach((l) => l());
      })
      .catch(() => {
        pending = null;
      });
  }
  return pending;
}

/** Returns the new modules' live data (design/social/media); re-renders once loaded. */
export function useLiveExtras() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    if (!loaded) void load();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return liveExtras;
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
