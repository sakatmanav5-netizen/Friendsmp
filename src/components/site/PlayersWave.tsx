type Props = { points?: number[]; className?: string };

const defaultPoints = [12, 18, 14, 22, 19, 28, 24, 34, 30, 42, 38, 52, 48, 64, 58, 76];

/** Smooth neon analytics wave for the live players box. */
export function PlayersWave({ points = defaultPoints, className = "" }: Props) {
  const w = 120;
  const h = 44;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = Math.max(1, max - min);

  const coords = points.map((p, i) => [
    (i / (points.length - 1)) * w,
    h - ((p - min) / span) * (h - 6) - 3,
  ]);

  const path = coords
    .map(([x = 0, y = 0], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px = 0, py = 0] = coords[i - 1] ?? [];
      const cx = (px + x) / 2;
      return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
    })
    .join(" ");

  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label="Live player activity"
    >
      <defs>
        <linearGradient id="wave-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.78 0.16 215)" />
          <stop offset="100%" stopColor="oklch(0.72 0.24 330)" />
        </linearGradient>
        <linearGradient id="wave-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.7 0.22 320 / 45%)" />
          <stop offset="100%" stopColor="oklch(0.7 0.22 320 / 0%)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wave-fill)" />
      <path
        d={path}
        fill="none"
        stroke="url(#wave-stroke)"
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
