import { MAX_BOOST_LEVEL } from "@discordia/client-shared";

import { BoostLevelIcon } from "./BoostLevelIcon";

interface BoostsSectionIconProps {
  size?: number;
  className?: string;
  onAccent?: boolean;
}

/** Ícono de Boosts en los menús de configuración: el nivel con las tres barras. */
export function BoostsSectionIcon({
  size = 16,
  className,
  onAccent = false,
}: BoostsSectionIconProps) {
  return (
    <BoostLevelIcon
      level={MAX_BOOST_LEVEL}
      size={size}
      bare
      onAccent={onAccent}
      className={className}
    />
  );
}
