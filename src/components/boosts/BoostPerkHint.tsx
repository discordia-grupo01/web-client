import {
  BOOST_PERK_LABELS,
  BOOST_PERK_LEVEL,
  type BoostLevel,
  type BoostPerk,
  boostPerkLevelLabel,
  boostPerkUnlockProgress,
  hasBoostPerk,
} from "@discordia/client-shared";

import { BoostLevelIcon } from "./BoostLevelIcon";

const ICON_SIZE = 24;

interface BoostPerkHintProps {
  perk: BoostPerk;
  level: BoostLevel;
  boostCount: number;
  unlockedHint: string;
}

export function BoostPerkHint({
  perk,
  level,
  boostCount,
  unlockedHint,
}: BoostPerkHintProps) {
  const unlocked = hasBoostPerk(level, perk);
  const levelLabel = boostPerkLevelLabel(perk);
  return (
    <div className="flex items-center gap-2.5">
      <span title={levelLabel} className="flex shrink-0">
        <BoostLevelIcon
          level={BOOST_PERK_LEVEL[perk]}
          size={ICON_SIZE}
          dimmed={!unlocked}
        />
        <span className="sr-only">{levelLabel}</span>
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-content-muted text-xs font-semibold">
          {BOOST_PERK_LABELS[perk]}
        </p>
        <p className="text-content-subtle text-[11px]">
          {unlocked ? unlockedHint : boostPerkUnlockProgress(perk, boostCount)}
        </p>
      </div>
    </div>
  );
}
