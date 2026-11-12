import {
  BOOST_LEVEL_ICON,
  type BoostLevel,
  brandViewBox,
  PREMIUM_BRAND_COLORS,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

/** Margen de la baldosa alrededor del ícono, igual que en app-mobile. */
const TILE_PADDING_RATIO = 0.2;

interface BoostLevelIconProps {
  level: BoostLevel;
  size?: number;
  dimmed?: boolean;
  className?: string;
}

export function BoostLevelIcon({
  level,
  size = 16,
  dimmed = false,
  className,
}: BoostLevelIconProps) {
  const {
    viewBox,
    bars,
    strokeWidth,
    filledStroke,
    filledStrokeOpacity,
    emptyStroke,
    emptyDash,
  } = BOOST_LEVEL_ICON;
  return (
    <span
      className={cn(
        "border-line bg-surface-input inline-flex shrink-0 items-center justify-center rounded-md border",
        dimmed && "opacity-60",
        className,
      )}
      style={{ padding: Math.round(size * TILE_PADDING_RATIO) }}
    >
      <svg
        width={size}
        height={size}
        viewBox={brandViewBox(viewBox)}
        aria-hidden="true"
      >
        {bars.map(({ fill, ...bar }, index) => {
          const filled = index < level;
          return (
            <rect
              key={bar.y}
              {...bar}
              fill={filled ? PREMIUM_BRAND_COLORS[fill] : "none"}
              stroke={PREMIUM_BRAND_COLORS[filled ? filledStroke : emptyStroke]}
              strokeOpacity={filled ? filledStrokeOpacity : 1}
              strokeWidth={strokeWidth}
              strokeDasharray={filled ? undefined : emptyDash}
            />
          );
        })}
      </svg>
    </span>
  );
}
