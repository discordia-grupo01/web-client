import {
  BOOST_PERK_LEVEL,
  BOOST_PERKS,
  BOOST_SHOWCASE_COPY,
  BOOST_SHOWCASE_TITLE,
  BOOST_UNLOCKED_LABEL,
  boostLevelLabel,
  hasBoostPerk,
  type ServerBoostSummary,
  type ServerSummary,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

import { BoostShowcaseArt } from "./BoostShowcaseArt";

interface BoostShowcaseProps {
  server: ServerSummary;
  summary: ServerBoostSummary;
}

export function BoostShowcase({ server, summary }: BoostShowcaseProps) {
  return (
    <section aria-labelledby="boost-showcase-title" className="space-y-3">
      <h3
        id="boost-showcase-title"
        className="font-display text-content text-base font-bold"
      >
        {BOOST_SHOWCASE_TITLE}
      </h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {BOOST_PERKS.map((perk) => {
          const unlocked = hasBoostPerk(summary.level, perk);
          const copy = BOOST_SHOWCASE_COPY[perk];
          return (
            <li
              key={perk}
              className={cn(
                "bg-surface-raised rounded-2xl border p-3.5",
                unlocked ? "border-accent" : "border-line opacity-75",
              )}
            >
              <BoostShowcaseArt perk={perk} server={server} />
              <div className="mt-3 flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <h4 className="font-display text-content text-sm font-bold">
                    {copy.title}
                  </h4>
                  <p className="text-content-muted mt-1 text-xs leading-relaxed">
                    {copy.detail}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.75 text-[10px] font-bold whitespace-nowrap",
                    unlocked
                      ? "bg-accent text-boost-paper"
                      : "bg-surface-input text-content-muted",
                  )}
                >
                  {unlocked
                    ? BOOST_UNLOCKED_LABEL
                    : boostLevelLabel(BOOST_PERK_LEVEL[perk])}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
