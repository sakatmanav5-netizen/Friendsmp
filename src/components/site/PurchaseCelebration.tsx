import { useEffect, useMemo, useState } from "react";

const COLORS = [
  "oklch(0.65 0.25 300)",
  "oklch(0.78 0.16 215)",
  "oklch(0.82 0.15 85)",
  "oklch(0.78 0.2 150)",
  "oklch(0.75 0.18 295)",
  "oklch(0.7 0.22 20)",
];

type Piece = { side: "l" | "r"; dx: number; dy: number; delay: number; size: number; color: string; rot: number };

function makePoppers(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const side = i % 2 === 0 ? "l" : "r";
    const dx = (180 + Math.random() * 260) * (side === "l" ? 1 : -1);
    return {
      side,
      dx,
      dy: -(260 + Math.random() * 360),
      delay: 1.9 + Math.random() * 0.25,
      size: 6 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rot: 360 + Math.random() * 720,
    };
  });
}

export function PurchaseCelebration({
  title = "Payment Successful!",
  subtitle,
  username,
  itemName,
  onDone,
}: {
  title?: string;
  subtitle?: string;
  username?: string;
  itemName?: string;
  onDone: () => void;
}) {
  const poppers = useMemo(() => makePoppers(70), []);
  const name = username && /^[A-Za-z0-9_]{3,16}$/.test(username) ? username : "Steve";
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    const t = setTimeout(onDone, 6500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      className="fixed inset-0 z-[80] overflow-hidden bg-background/85 backdrop-blur-sm"
    >
      {/* Purple spotlight from top-left edge */}
      <span aria-hidden className="emc-spotlight" />

      {/* Minecraft-style advancement toast (top-right, away from the light) */}
      <div className="emc-toast" aria-hidden>
        <div className="emc-toast-icon">
          {imgOk ? (
            <img src={`https://mc-heads.net/avatar/${name}/32`} alt="" width={32} height={32} />
          ) : (
            <span>★</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="emc-toast-head">Advancement Made!</p>
          <p className="emc-toast-title">{itemName ? `${itemName} Unlocked` : "Purchase Complete"}</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="emc-avatar-in relative grid place-items-center">
          <span aria-hidden className="fsmp-ring-expand absolute h-40 w-40 rounded-full border-2 border-primary" />
          <span aria-hidden className="absolute h-44 w-44 rounded-full neon-ring opacity-60" />
          <div className="emc-avatar-look">
            {imgOk ? (
              <img
                src={`https://mc-heads.net/body/${name}/150`}
                alt={`${name} avatar`}
                onError={() => setImgOk(false)}
                className="emc-pixel h-[190px] w-auto drop-shadow-[0_0_24px_oklch(0.65_0.25_300/70%)]"
              />
            ) : (
              <span className="grid h-32 w-32 place-items-center rounded-2xl btn-neon text-5xl font-black">✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Party poppers from bottom corners */}
      {poppers.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="emc-popper"
          style={{
            [p.side === "l" ? "left" : "right"]: "4%",
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            animationDelay: `${p.delay}s`,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
            ["--rot" as string]: `${p.rot}deg`,
          }}
        />
      ))}

      <div className="emc-text-in absolute inset-x-0 bottom-[14%] px-6 text-center">
        <p className="font-display text-2xl font-black tracking-tight text-glow sm:text-3xl">{title}</p>
        {subtitle && <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-muted-foreground">{subtitle}</p>}
        <p className="mt-4 text-[11px] text-muted-foreground">Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}
