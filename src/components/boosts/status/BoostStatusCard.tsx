import {
  BOOST_MAX_LEVEL_DETAIL,
  BOOST_MAX_LEVEL_NOTE,
  BOOST_MAX_LEVEL_TITLE,
  BOOST_NEXT_LEVEL_LABEL,
  boostActivePerksLabel,
  boostCountLabel,
  boostLevelLabel,
  boostLevelUnlocks,
  boostProgress,
  boostProgressAriaLabel,
  boostProgressCountLabel,
  BOOSTED_BADGE_COPY,
  boostsToNextLevelParts,
  hasBoostedBadge,
  type ServerBoostSummary,
} from "@discordia/client-shared";

import { BoostedBadge } from "../icons/BoostedBadge";
import { BoostLevelIcon } from "../icons/BoostLevelIcon";

interface BoostStatusCardProps {
  summary: ServerBoostSummary;
}

export function BoostStatusCard({ summary }: BoostStatusCardProps) {
  const progress = boostProgress(summary);
  const { nextLevel } = progress;

  return (
    <section
      aria-labelledby="boost-status-title"
      className="border-accent bg-surface-raised overflow-hidden rounded-2xl border"
    >
      <div className="bg-boost-band text-boost-on-band flex flex-col gap-4 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="bg-boost-band-tile border-boost-band-line flex size-14 shrink-0 items-center justify-center rounded-2xl border sm:size-15">
            <BoostLevelIcon level={summary.level} size={36} bare />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3
                id="boost-status-title"
                className="font-display text-2xl leading-none font-bold"
              >
                {boostLevelLabel(summary.level)}
              </h3>
              <span className="bg-boost-band-tile rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums">
                {boostCountLabel(summary.boost_count)}
              </span>
            </div>
            <p className="text-boost-on-band-muted text-sm leading-snug">
              {boostActivePerksLabel(summary.level)}
            </p>
          </div>
          {nextLevel ? (
            <div className="bg-boost-paper hidden shrink-0 items-center gap-2.5 rounded-xl py-2 pr-3 pl-2.5 sm:flex">
              <BoostLevelIcon level={nextLevel} size={26} bare />
              <span className="flex flex-col gap-0.5">
                <span className="text-accent text-[10px] font-bold tracking-wider uppercase">
                  {BOOST_NEXT_LEVEL_LABEL}
                </span>
                <span className="font-display text-boost-ink text-sm font-bold">
                  {boostLevelLabel(nextLevel)}
                </span>
              </span>
            </div>
          ) : hasBoostedBadge(summary.level) ? (
            <div className="bg-boost-paper hidden shrink-0 items-center gap-2.5 rounded-xl py-2 pr-3 pl-2.5 sm:flex">
              <BoostedBadge size={26} surface="light" decorative />
              <span className="flex flex-col gap-0.5">
                <span className="text-accent text-[10px] font-bold tracking-wider uppercase">
                  {BOOSTED_BADGE_COPY.caption}
                </span>
                <span className="font-display text-boost-ink text-sm font-bold">
                  {BOOSTED_BADGE_COPY.label}
                </span>
              </span>
            </div>
          ) : null}
        </div>

        {nextLevel ? (
          <NextLevelProgress
            level={nextLevel}
            boostCount={summary.boost_count}
            ratio={progress.ratio}
            target={progress.target ?? 0}
          />
        ) : (
          <p className="text-sm">
            <strong className="font-display">{BOOST_MAX_LEVEL_TITLE}</strong>{" "}
            <span className="text-boost-on-band-muted">
              {BOOST_MAX_LEVEL_DETAIL}
            </span>
          </p>
        )}
      </div>

      {nextLevel ? (
        <p className="text-content-muted px-5 py-3.5 text-xs sm:px-6">
          {boostLevelUnlocks(nextLevel).lead}{" "}
          <span className="text-content">
            {boostLevelUnlocks(nextLevel).perks}
          </span>
        </p>
      ) : (
        <p className="text-content-muted px-5 py-3.5 text-xs sm:px-6">
          {BOOST_MAX_LEVEL_NOTE}
        </p>
      )}
    </section>
  );
}

interface NextLevelProgressProps {
  level: Exclude<ServerBoostSummary["level"], 0>;
  boostCount: number;
  ratio: number;
  target: number;
}

function NextLevelProgress({
  level,
  boostCount,
  ratio,
  target,
}: NextLevelProgressProps) {
  const parts = boostsToNextLevelParts(level, boostCount);
  const percent = `${Math.round(ratio * 1000) / 10}%`;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-boost-on-band-muted">
          {parts.lead}{" "}
          <strong className="text-boost-band-highlight">{parts.amount}</strong>{" "}
          {parts.tail}
        </span>
        <span className="font-bold tabular-nums">
          {boostProgressCountLabel(boostCount, target)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={boostProgressAriaLabel(level, boostCount)}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={boostCount}
        className="relative h-4"
      >
        <div className="bg-boost-track absolute inset-x-0 top-0.75 h-2.5 overflow-hidden rounded-full">
          <div
            className="bg-info h-full rounded-full"
            style={{ width: percent }}
          />
        </div>
        <span
          className="bg-boost-yellow border-boost-ink absolute top-0 size-4 -translate-x-1/2 rounded border-2"
          style={{ left: percent }}
        />
      </div>
    </div>
  );
}
