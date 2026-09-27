export type SiteDesign = {
  /** 0-360 hue for the primary/neon brand colour (cyan & gold accents stay fixed). */
  hue: number;
  /** Base corner radius in rem — drives every rounded-* utility site-wide. */
  radius: number;
  /** Glow / shadow intensity preset for neon-ring, cyan-ring, gold-ring, buttons. */
  glow: "subtle" | "normal" | "intense";
  /** Min height (px) of the 3 homepage store cards (Ranks / Crate Keys / Coins). */
  cardMinHeight: number;
  /** Display order of the 3 homepage store cards. */
  homeCardOrder: ("ranks" | "crates" | "coins")[];
  /** Footer vertical padding preset. */
  footerSpacing: "compact" | "normal" | "roomy";
};

export const defaultDesign: SiteDesign = {
  hue: 300,
  radius: 0.875,
  glow: "normal",
  cardMinHeight: 300,
  homeCardOrder: ["ranks", "crates", "coins"],
  footerSpacing: "normal",
};

const glowAlpha: Record<SiteDesign["glow"], { ring1: number; ring2: number; btn: number }> = {
  subtle: { ring1: 30, ring2: 48, btn: 55 },
  normal: { ring1: 45, ring2: 70, btn: 80 },
  intense: { ring1: 62, ring2: 90, btn: 95 },
};

const footerPy: Record<SiteDesign["footerSpacing"], string> = {
  compact: "0.75rem",
  normal: "1rem",
  roomy: "1.75rem",
};

/** Merge partial/owner-saved values over the defaults so old saves never crash. */
export function withDesignDefaults(value: Partial<SiteDesign> | null | undefined): SiteDesign {
  return {
    ...defaultDesign,
    ...(value ?? {}),
    homeCardOrder:
      value?.homeCardOrder && value.homeCardOrder.length === 3
        ? value.homeCardOrder
        : defaultDesign.homeCardOrder,
  };
}

/**
 * Applies the owner's design picks as CSS custom properties on <html>.
 * Every colour in styles.css is already read from these variables, so this
 * recolours/reshapes the whole site without touching any component's markup.
 * Cyan/gold accents (Crate Keys / Coins rings) are intentionally left alone —
 * "hue" only steers the primary/neon brand colour.
 */
export function applyDesignVars(design: SiteDesign) {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  const h = ((design.hue % 360) + 360) % 360;
  const g = glowAlpha[design.glow] ?? glowAlpha.normal;

  root.setProperty("--radius", `${design.radius}rem`);

  root.setProperty("--card", `oklch(0.17 0.045 ${h})`);
  root.setProperty("--popover", `oklch(0.15 0.04 ${h})`);
  root.setProperty("--primary", `oklch(0.6 0.24 ${h})`);
  root.setProperty("--secondary", `oklch(0.24 0.06 ${h})`);
  root.setProperty("--muted", `oklch(0.22 0.05 ${h})`);
  root.setProperty("--muted-foreground", `oklch(0.7 0.045 ${h - 5})`);
  root.setProperty("--accent", `oklch(0.28 0.09 ${h})`);
  root.setProperty("--border", `oklch(0.35 0.09 ${h} / 40%)`);
  root.setProperty("--input", `oklch(0.3 0.07 ${h} / 60%)`);
  root.setProperty("--ring", `oklch(0.65 0.22 ${h})`);

  root.setProperty("--neon", `oklch(0.65 0.25 ${h})`);
  root.setProperty("--neon-soft", `oklch(0.75 0.18 ${h - 5})`);
  root.setProperty("--panel", `oklch(0.14 0.04 ${h} / 65%)`);

  root.setProperty("--sidebar", `oklch(0.08 0.03 ${h})`);
  root.setProperty("--sidebar-accent", `oklch(0.3 0.12 ${h})`);
  root.setProperty("--sidebar-border", `oklch(0.3 0.08 ${h} / 45%)`);

  root.setProperty("--gradient-neon", `linear-gradient(135deg, oklch(0.58 0.25 ${h}), oklch(0.68 0.2 ${h - 25}))`);
  root.setProperty(
    "--shadow-neon",
    `0 0 0 1px oklch(0.6 0.22 ${h} / ${g.ring1}%), 0 18px 50px -18px oklch(0.6 0.25 ${h} / ${g.ring2}%)`,
  );
  root.setProperty("--fsmp-btn-shadow", `0 10px 30px -10px oklch(0.6 0.25 ${h} / ${g.btn}%)`);
  root.setProperty(
    "--fsmp-btn-shadow-hover",
    `0 16px 40px -10px oklch(0.65 0.26 ${h} / ${Math.min(98, g.btn + 15)}%)`,
  );

  // Cyan/gold rings keep their hue but still breathe with the glow intensity.
  root.setProperty("--shadow-cyan", `0 0 0 1px oklch(0.75 0.16 215 / ${g.ring1}%), 0 18px 50px -18px oklch(0.7 0.18 215 / ${g.ring2 - 10}%)`);
  root.setProperty("--shadow-gold", `0 0 0 1px oklch(0.82 0.14 85 / ${g.ring1 - 5}%), 0 18px 50px -18px oklch(0.8 0.15 80 / ${g.ring2 - 15}%)`);

  root.setProperty("--fsmp-card-h", `${design.cardMinHeight}px`);
  root.setProperty("--fsmp-footer-py", footerPy[design.footerSpacing] ?? footerPy.normal);
}
