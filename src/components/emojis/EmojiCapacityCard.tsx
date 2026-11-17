import {
  type BoostLevel,
  emojiCapacityTitleFor,
  emojiSlotsHint,
  emojiSlotsTotalLabel,
} from "@discordia/client-shared";

import { BoostBenefitChip } from "@/components/boosts/benefits/BoostBenefitChip";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/cn";

interface EmojiCapacityCardProps {
  serverName: string;
  used: number;
  max: number;
  level: BoostLevel;
  boostCount: number;
}

export function EmojiCapacityCard({
  serverName,
  used,
  max,
  level,
  boostCount,
}: EmojiCapacityCardProps) {
  const ratio = max > 0 ? Math.min(1, used / max) : 1;
  const isFull = used >= max;
  const title = emojiCapacityTitleFor(serverName);

  return (
    <section className="bg-surface-raised border-line rounded-2xl border px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <SectionLabel>{title}</SectionLabel>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-display text-content text-3xl leading-none font-bold tabular-nums">
              {used}
            </span>
            <span className="text-content-muted text-sm leading-none font-medium">
              {emojiSlotsTotalLabel(max)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <BoostBenefitChip
            perk="extra_emoji_slots"
            level={level}
            boostCount={boostCount}
          />
          <span className="text-content-subtle text-xs">
            {emojiSlotsHint(level)}
          </span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(used, max)}
        className="bg-surface-input mt-5 h-2 overflow-hidden rounded-full"
      >
        <div
          className={cn(
            "h-full rounded-full",
            isFull ? "bg-warning" : "bg-accent",
          )}
          style={{ width: `${Math.round(ratio * 1000) / 10}%` }}
        />
      </div>
    </section>
  );
}
