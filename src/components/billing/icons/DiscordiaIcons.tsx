import {
  type BrandRect,
  type BrandStroke,
  brandViewBox,
  POINT_ICON,
  PREMIUM_BADGE,
  PREMIUM_BRAND_COLORS as COLORS,
  PREMIUM_ICON,
  PREMIUM_MARK,
  premiumBadgeOutlineWidth,
  premiumBadgeWidth,
  showsPremiumBadgeModules,
} from "@discordia/client-shared";

type IconProps = { size?: number; className?: string };

const Rect = ({ fill, ...rect }: BrandRect) => (
  <rect {...rect} fill={COLORS[fill]} />
);

const Stroke = ({
  stroke,
  rounded = false,
  ...path
}: BrandStroke & { rounded?: boolean }) => (
  <path
    {...path}
    fill="none"
    stroke={COLORS[stroke]}
    strokeLinecap={rounded ? "round" : undefined}
  />
);

export const DiscordiaPremiumIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox={brandViewBox(PREMIUM_ICON.viewBox)}
    className={className}
    aria-hidden="true"
  >
    {PREMIUM_ICON.blocks.map((block) => (
      <Rect key={`${block.x}-${block.y}`} {...block} />
    ))}
    <Stroke {...PREMIUM_ICON.connector} rounded />
  </svg>
);

export const DiscordiaPointIcon = ({ size = 16, className }: IconProps) => {
  const { coin, coinCenter } = POINT_ICON;
  return (
    <svg
      width={size}
      height={size}
      viewBox={brandViewBox(POINT_ICON.viewBox)}
      className={className}
      aria-hidden="true"
    >
      <Stroke {...POINT_ICON.cable} rounded />
      <circle
        cx={coin.cx}
        cy={coin.cy}
        r={coin.r}
        fill={COLORS[coin.fill]}
        stroke={COLORS[coin.stroke]}
        strokeWidth={coin.strokeWidth}
      />
      <circle
        cx={coinCenter.cx}
        cy={coinCenter.cy}
        r={coinCenter.r}
        fill={COLORS[coinCenter.fill]}
      />
    </svg>
  );
};

export const DiscordiaPremiumMark = ({ size = 120, className }: IconProps) => {
  const { dot } = PREMIUM_MARK;
  return (
    <svg
      width={size}
      height={size}
      viewBox={brandViewBox(PREMIUM_MARK.viewBox)}
      className={className}
      aria-hidden="true"
    >
      <Rect {...PREMIUM_MARK.tile} />
      <g transform={PREMIUM_MARK.transform}>
        <Stroke {...PREMIUM_MARK.arc} />
        {PREMIUM_MARK.modules.map((module) => (
          <Rect key={module.y} {...module} />
        ))}
        <Stroke {...PREMIUM_MARK.cable} rounded />
        <Rect {...PREMIUM_MARK.connector} />
        <circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={COLORS[dot.fill]} />
      </g>
    </svg>
  );
};

export const DiscordiaPremiumBadge = ({ size = 40, className }: IconProps) => {
  const { hexagon, outerD, innerD } = PREMIUM_BADGE;
  return (
    <svg
      width={premiumBadgeWidth(size)}
      height={size}
      viewBox={brandViewBox(PREMIUM_BADGE.viewBox)}
      className={className}
      aria-hidden="true"
    >
      <polygon
        points={hexagon.points}
        fill={COLORS[hexagon.fill]}
        stroke={COLORS[hexagon.stroke]}
        strokeWidth={premiumBadgeOutlineWidth(size)}
        strokeLinejoin="round"
      />
      <g transform={PREMIUM_BADGE.transform}>
        <path d={outerD.d} fill={COLORS[outerD.fill]} />
        <path d={innerD.d} fill={COLORS[innerD.fill]} />
        {showsPremiumBadgeModules(size)
          ? PREMIUM_BADGE.modules.map((module) => (
              <Rect key={module.y} {...module} />
            ))
          : null}
        <Rect {...PREMIUM_BADGE.piece} />
      </g>
    </svg>
  );
};
