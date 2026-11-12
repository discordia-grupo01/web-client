import {
  BOOST_LEVEL_THRESHOLDS,
  type BoostLevel,
  boostCountLabel,
  boostLevelLabel,
  boostsUntilLevelLabel,
  nextBoostLevel,
} from "@discordia/client-shared";

import { BoostLevelIcon } from "./BoostLevelIcon";
import { BoostProgressBar } from "./BoostProgressBar";
import { BoostServerButton } from "./BoostServerButton";

interface BoostProgressStripProps {
  level: BoostLevel;
  boostCount: number;
  onBoost?: () => void;
  compact?: boolean;
}

export function BoostProgressStrip({
  level,
  boostCount,
  onBoost,
  compact = false,
}: BoostProgressStripProps) {
  const next = nextBoostLevel(level);
  if (next === undefined) return null;

  const target = BOOST_LEVEL_THRESHOLDS[next - 1];
  const progress = boostsUntilLevelLabel(next, boostCount);
  const count = `${Math.min(boostCount, target)}/${target}`;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <BoostProgressBar
            boostCount={boostCount}
            target={target}
            label={progress}
          />
        </div>
        <span className="text-content-subtle text-[11px] tabular-nums">
          {count}
        </span>
      </div>
    );
  }

  return (
    <div className="border-line bg-surface-raised space-y-2.5 rounded-xl border px-3 py-2.5">
      <div className="flex items-center gap-3">
        <BoostLevelIcon level={level} size={24} />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex justify-between gap-3 text-[11px]">
            <span className="text-content-muted">
              <span className="font-semibold">{boostLevelLabel(level)}</span> ·{" "}
              {boostCountLabel(boostCount)}
            </span>
            <span className="text-content-subtle tabular-nums">{count}</span>
          </div>
          <BoostProgressBar
            boostCount={boostCount}
            target={target}
            label={progress}
          />
        </div>
      </div>
      {onBoost ? (
        <div className="flex justify-end">
          <BoostServerButton onClick={onBoost} />
        </div>
      ) : null}
    </div>
  );
}
