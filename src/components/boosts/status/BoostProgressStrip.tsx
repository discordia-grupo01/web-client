import {
  BOOST_PROGRESS_STRIP_COPY,
  BOOST_SECTION_TAB_LABELS,
  type BoostLevel,
  boostCountLabel,
  boostLevelLabel,
  boostProgressAriaLabel,
  boostProgressCountLabel,
  boostsForLevelParts,
  boostsRequiredFor,
  nextBoostLevel,
} from "@discordia/client-shared";

import { BoostActionIcon } from "../icons/BoostActionIcon";
import { BoostLevelIcon } from "../icons/BoostLevelIcon";
import { BoostProgressBar } from "./BoostProgressBar";

interface BoostProgressStripProps {
  level: BoostLevel;
  boostCount: number;
  onBoost?: () => void;
  onShowBenefits?: () => void;
}

export function BoostProgressStrip({
  level,
  boostCount,
  onBoost,
  onShowBenefits,
}: BoostProgressStripProps) {
  const next = nextBoostLevel(level);
  if (next === undefined) return null;

  const target = boostsRequiredFor(next);
  const parts = boostsForLevelParts(next, boostCount);

  return (
    <section
      aria-label={BOOST_PROGRESS_STRIP_COPY.ariaLabel}
      className="border-accent bg-boost-band text-boost-on-band flex flex-wrap items-center gap-3.5 rounded-[14px] border px-3.5 py-3 sm:flex-nowrap"
    >
      <span className="bg-boost-band-tile border-boost-band-line flex size-10 shrink-0 items-center justify-center rounded-[10px] border">
        <BoostLevelIcon level={level} size={26} bare />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2.5">
          <span className="text-[13px]">
            <strong className="font-display text-[15px]">
              {boostLevelLabel(level)}
            </strong>{" "}
            <span className="text-boost-on-band-muted">
              · {boostCountLabel(boostCount)}
            </span>
          </span>
          <span className="text-xs font-bold tabular-nums">
            {boostProgressCountLabel(boostCount, target)}
          </span>
        </div>
        <BoostProgressBar
          boostCount={boostCount}
          target={target}
          label={boostProgressAriaLabel(next, boostCount)}
          size="sm"
        />
        <p className="text-boost-on-band-muted text-xs">
          {parts.lead}{" "}
          <strong className="text-boost-band-highlight">{parts.amount}</strong>{" "}
          {parts.tail}
          {onShowBenefits ? (
            <>
              {" · "}
              <button
                type="button"
                onClick={onShowBenefits}
                className="text-boost-on-band cursor-pointer font-semibold hover:underline"
              >
                {BOOST_PROGRESS_STRIP_COPY.benefitsLink} ›
              </button>
            </>
          ) : null}
        </p>
      </div>
      {onBoost ? (
        <button
          type="button"
          onClick={onBoost}
          className="font-display bg-boost-cta text-boost-on-cta focus-visible:ring-accent ml-auto flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] pr-3.5 pl-1.75 text-[13px] font-bold transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97]"
        >
          <span className="bg-surface-modal flex size-5.5 items-center justify-center rounded-md">
            <BoostActionIcon size={16} />
          </span>
          {BOOST_SECTION_TAB_LABELS.boost}
        </button>
      ) : null}
    </section>
  );
}
