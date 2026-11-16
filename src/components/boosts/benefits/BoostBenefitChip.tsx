import {
  type BoostLevel,
  type BoostPerk,
  boostBenefitChip,
} from "@discordia/client-shared";
import { Check, Lock } from "lucide-react";

import { cn } from "@/lib/cn";

import { BoostLevelIcon } from "../icons/BoostLevelIcon";

interface BoostBenefitChipProps {
  perk: BoostPerk;
  level: BoostLevel;
  boostCount: number;
}

export function BoostBenefitChip({
  perk,
  level,
  boostCount,
}: BoostBenefitChipProps) {
  const chip = boostBenefitChip(perk, level, boostCount);

  return (
    <span
      title={chip.title}
      className={cn(
        "inline-flex h-6.5 shrink-0 items-center gap-1.5 rounded-full border pr-2.5 pl-1.25 text-[11px] font-bold whitespace-nowrap",
        chip.locked
          ? "border-line-strong bg-surface-input text-content"
          : "border-accent bg-accent text-on-accent",
      )}
    >
      <BoostLevelIcon
        level={chip.level}
        size={16}
        bare
        onAccent={!chip.locked}
      />
      <span aria-hidden="true">{chip.label}</span>
      {chip.locked ? (
        <>
          {chip.detail ? (
            <span aria-hidden="true" className="text-content-muted font-medium">
              {chip.detail}
            </span>
          ) : null}
          <Lock
            size={12}
            strokeWidth={2.4}
            aria-hidden="true"
            className="text-content-muted"
          />
        </>
      ) : (
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      )}
      <span className="sr-only">{chip.accessibilityLabel}</span>
    </span>
  );
}
