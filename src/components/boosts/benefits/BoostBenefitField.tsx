import { type BoostLevel, type BoostPerk } from "@discordia/client-shared";
import { type ReactNode } from "react";

import { BoostBenefitChip } from "./BoostBenefitChip";

interface BoostBenefitFieldProps {
  perk: BoostPerk;
  level: BoostLevel;
  boostCount: number;
  title: string;
  children: ReactNode;
}

export function BoostBenefitField({
  perk,
  level,
  boostCount,
  title,
  children,
}: BoostBenefitFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2.5">
        <h3 className="text-content font-display text-sm font-semibold">
          {title}
        </h3>
        <BoostBenefitChip perk={perk} level={level} boostCount={boostCount} />
      </div>
      {children}
    </div>
  );
}
