import {
  BOOST_LEVEL_ICON,
  type BoostLevel,
  brandViewBox,
  PREMIUM_BRAND_COLORS,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

const TILE_PADDING_RATIO = 0.2;

interface BoostLevelIconProps {
  level: BoostLevel;
  size?: number;
  dimmed?: boolean;
  bare?: boolean;
  /** Sobre un fondo `accent`: el borde de las barras llenas va claro. */
  onAccent?: boolean;
  /** Recorta el aire alrededor de las barras: para tamaños chicos. */
  tight?: boolean;
  className?: string;
}

const ON_ACCENT_STROKE_WIDTH = 0.4;

export function BoostLevelIcon({
  level,
  size = 16,
  dimmed = false,
  bare = false,
  onAccent = false,
  tight = false,
  className,
}: BoostLevelIconProps) {
  const {
    viewBox,
    tightViewBox,
    bars,
    strokeWidth,
    filledStrokeWidth,
    emptyDash,
  } = BOOST_LEVEL_ICON;
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox={brandViewBox(tight ? tightViewBox : viewBox)}
      className={bare ? className : undefined}
      aria-hidden="true"
    >
      {bars.map(({ fill, ...bar }, index) => {
        const filled = index < level;
        return (
          <rect
            key={bar.y}
            {...bar}
            fill={filled ? PREMIUM_BRAND_COLORS[fill] : "none"}
            className={
              filled
                ? onAccent
                  ? "stroke-boost-paper"
                  : "stroke-boost-level-outline"
                : "stroke-boost-level-empty"
            }
            strokeWidth={
              filled
                ? onAccent
                  ? ON_ACCENT_STROKE_WIDTH
                  : filledStrokeWidth
                : strokeWidth
            }
            strokeDasharray={filled ? undefined : emptyDash}
          />
        );
      })}
    </svg>
  );
  if (bare) return svg;

  return (
    <span
      className={cn(
        "border-line bg-surface-input inline-flex shrink-0 items-center justify-center rounded-md border",
        dimmed && "opacity-60",
        className,
      )}
      style={{ padding: Math.round(size * TILE_PADDING_RATIO) }}
    >
      {svg}
    </span>
  );
}
