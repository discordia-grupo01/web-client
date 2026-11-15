import {
  BOOSTED_BADGE,
  BOOSTED_BADGE_COPY,
  boostedBadgeStrokeWidth,
  boostedBadgeTooltip,
  brandViewBox,
  MAX_BOOST_LEVEL,
  PREMIUM_BRAND_COLORS,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

interface BoostedBadgeProps {
  size?: number;
  surface?: "theme" | "dark" | "light";
  decorative?: boolean;
  className?: string;
}

export function BoostedBadge({
  size = 16,
  surface = "theme",
  decorative = false,
  className,
}: BoostedBadgeProps) {
  const { viewBox, hexagon, bars, piece } = BOOSTED_BADGE;
  return (
    <svg
      width={size}
      height={size}
      viewBox={brandViewBox(viewBox)}
      data-theme={surface === "theme" ? undefined : surface}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : BOOSTED_BADGE_COPY.label}
      className={cn("shrink-0", className)}
    >
      {decorative ? null : (
        <title>{boostedBadgeTooltip(MAX_BOOST_LEVEL)}</title>
      )}
      <polygon
        points={hexagon.points}
        fill={PREMIUM_BRAND_COLORS[hexagon.fill]}
        strokeWidth={boostedBadgeStrokeWidth(size)}
        strokeLinejoin="round"
        className="stroke-boost-badge-outline"
      />
      {bars.map(({ fill, ...bar }) => (
        <rect key={bar.y} {...bar} fill={PREMIUM_BRAND_COLORS[fill]} />
      ))}
      <rect
        x={piece.x}
        y={piece.y}
        width={piece.width}
        height={piece.height}
        rx={piece.rx}
        fill={PREMIUM_BRAND_COLORS[piece.fill]}
        stroke={PREMIUM_BRAND_COLORS[piece.stroke]}
        strokeWidth={piece.strokeWidth}
      />
    </svg>
  );
}
