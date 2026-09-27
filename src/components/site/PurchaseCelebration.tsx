import { useEffect, useMemo } from "react";
import { Check } from "lucide-react";

const CONFETTI_COLORS = [
  "oklch(0.65 0.25 300)", // neon purple
  "oklch(0.78 0.16 215)", // cyan
  "oklch(0.82 0.15 85)", // gold
  "oklch(0.78 0.2 150)", // online green
  "oklch(0.75 0.18 295)", // neon soft
];

type Piece = { left: number; delay: number; duration: number; size: number; color: string; drift: number };

function makeConfetti(count: number): Piece[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.35,
    duration: 1.6 + Math.random() * 1.2,
    size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    drift: (Math.random() - 0.5) * 120,
  }));
}

export function PurchaseCelebration({
  title = "Payment Successful!",
  subtitle,
  onDone,
}: {
  title?: string;
  subtitle?: string;
  onDone: () => void;
}) {
  const confetti = useMemo(() => makeConfetti(46), []);

  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-background/85 backdrop-blur-sm"
    >
      {confetti.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="fsmp-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--tw-translate-x" as string]: `${p.drift}px`,
            transform: `translateX(${p.drift}px)`,
          }}
        />
      ))}

      <div className="fsmp-pop-in relative grid place-items-center">
        <span aria-hidden className="fsmp-ring-expand absolute h-24 w-24 rounded-full border-2 border-primary" />
        <span aria-hidden className="absolute h-24 w-24 rounded-full border-2 border-primary/40" style={{ animationDelay: "0.35s" }} />
        <span className="grid h-24 w-24 place-items-center rounded-full btn-neon">
          <Check className="h-11 w-11" strokeWidth={3} />
        </span>
      </div>

      <div className="fsmp-pop-in absolute bottom-[28%] px-6 text-center" style={{ animationDelay: "0.15s" }}>
        <p className="font-display text-2xl font-black tracking-tight text-glow sm:text-3xl">{title}</p>
        {subtitle && <p className="mt-1.5 max-w-sm text-[13px] text-muted-foreground">{subtitle}</p>}
        <p className="mt-4 text-[11px] text-muted-foreground">Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}
