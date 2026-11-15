import {
  BOOST_ACTION_COPY,
  BOOST_COST_POINTS,
  boostPointsMissingLabel,
  canAffordBoost,
} from "@discordia/client-shared";

import { DiscordiaPointIcon } from "@/components/billing/icons/DiscordiaIcons";
import { cn } from "@/lib/cn";

import { BoostActionIcon } from "../icons/BoostActionIcon";

interface BoostActionCardProps {
  balance: number;
  disabled?: boolean;
  onBoost: () => void;
  onBuyPoints: () => void;
}

function PointsFact({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-input flex-1 rounded-xl px-3 py-1.5">
      <div className="text-content-subtle text-[10px] font-bold tracking-wider uppercase">
        {label}
      </div>
      <div className="font-display text-content flex items-center gap-1 text-sm font-bold tabular-nums">
        <DiscordiaPointIcon size={14} />
        {value}
      </div>
    </div>
  );
}

export function BoostActionCard({
  balance,
  disabled = false,
  onBoost,
  onBuyPoints,
}: BoostActionCardProps) {
  const canAfford = canAffordBoost(balance);

  return (
    <section
      aria-labelledby="boost-action-title"
      className="border-line bg-surface-raised overflow-hidden rounded-2xl border"
    >
      <div className="flex flex-col gap-3.5 p-4">
        <div className="flex items-start gap-3">
          <span className="bg-surface-input flex size-9 shrink-0 items-center justify-center rounded-xl">
            <BoostActionIcon size={20} />
          </span>
          <div>
            <h3
              id="boost-action-title"
              className="font-display text-content text-sm font-bold"
            >
              {BOOST_ACTION_COPY.title}
            </h3>
            <p className="text-content-muted mt-0.5 text-xs leading-snug">
              {BOOST_ACTION_COPY.description}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <PointsFact
            label={BOOST_ACTION_COPY.costLabel}
            value={BOOST_COST_POINTS}
          />
          <PointsFact label={BOOST_ACTION_COPY.balanceLabel} value={balance} />
        </div>

        <button
          type="button"
          onClick={onBoost}
          disabled={!canAfford || disabled}
          className="font-display bg-accent text-on-accent focus-visible:ring-accent flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="bg-surface-modal flex size-5.5 items-center justify-center rounded-md">
            <BoostActionIcon size={16} />
          </span>
          {BOOST_ACTION_COPY.cta}
        </button>
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t px-4 py-2.5 text-xs",
          canAfford
            ? "border-line bg-surface-input text-content-muted"
            : "bg-danger-soft text-danger border-danger/30",
        )}
      >
        <span className={cn(!canAfford && "font-semibold")}>
          {canAfford
            ? BOOST_ACTION_COPY.moreBoosts
            : boostPointsMissingLabel(balance)}
        </span>
        <button
          type="button"
          onClick={onBuyPoints}
          className="text-accent-strong shrink-0 cursor-pointer font-semibold hover:underline"
        >
          {BOOST_ACTION_COPY.buyPoints}
        </button>
      </div>
    </section>
  );
}
