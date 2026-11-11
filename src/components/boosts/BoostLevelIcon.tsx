import {
  BOOST_LEVEL_ICON,
  type BoostLevel,
  brandViewBox,
  PREMIUM_BRAND_COLORS,
} from "@discordia/client-shared";

interface BoostLevelIconProps {
  level: BoostLevel;
  size?: number;
  className?: string;
}

export function BoostLevelIcon({
  level,
  size = 16,
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
    <svg
      width={size}
      height={size}
      viewBox={brandViewBox(viewBox)}
      className={className}
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
  );
}
