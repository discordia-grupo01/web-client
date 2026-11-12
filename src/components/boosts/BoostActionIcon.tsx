import {
  BOOST_ACTION_ICON,
  brandViewBox,
  PREMIUM_BRAND_COLORS,
} from "@discordia/client-shared";

interface BoostActionIconProps {
  size?: number;
  className?: string;
}

export function BoostActionIcon({
  size = 16,
  className,
}: BoostActionIconProps) {
  const { viewBox, blocks, connector } = BOOST_ACTION_ICON;
  return (
    <svg
      width={size}
      height={size}
      viewBox={brandViewBox(viewBox)}
      className={className}
      aria-hidden="true"
    >
      {blocks.map(({ fill, ...block }) => (
        <rect key={block.y} {...block} fill={PREMIUM_BRAND_COLORS[fill]} />
      ))}
      <path
        d={connector.d}
        stroke={PREMIUM_BRAND_COLORS[connector.stroke]}
        strokeWidth={connector.strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
