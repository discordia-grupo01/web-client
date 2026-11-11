import {
  BOOST_PERK_LABELS,
  BOOST_PERK_LEVEL,
  type BoostLevel,
  type BoostPerk,
  boostPerkLevelLabel,
  boostPerkUnlockProgress,
  hasBoostPerk,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

import { BoostLevelIcon } from "./BoostLevelIcon";

interface BoostPerkHintProps {
  perk: BoostPerk;
  level: BoostLevel;
  boostCount: number;
  unlockedHint: string;
  showLabel?: boolean;
}

export function BoostPerkHint({
  perk,
  level,
  boostCount,
  unlockedHint,
  showLabel = true,
}: BoostPerkHintProps) {
  const unlocked = hasBoostPerk(level, perk);
  const levelLabel = boostPerkLevelLabel(perk);
  return (
    <p className="text-content-subtle flex items-center gap-1.5 text-[11px]">
      <span title={levelLabel} className="flex shrink-0">
        <BoostLevelIcon
          level={BOOST_PERK_LEVEL[perk]}
          size={14}
          className={cn(!unlocked && "opacity-60")}
        />
        <span className="sr-only">{levelLabel}</span>
      </span>
      <span>
        {showLabel ? (
          <span className="text-content-muted font-semibold">
            {BOOST_PERK_LABELS[perk]} ·{" "}
          </span>
        ) : null}
        {unlocked ? unlockedHint : boostPerkUnlockProgress(perk, boostCount)}
      </span>
    </p>
  );
}
