import { BOOST_POINTS_PROMO_COPY } from "@discordia/client-shared";

import { BoostActionIcon } from "@/components/boosts/icons/BoostActionIcon";

interface BoostPointsPromoProps {
  onShowBoosts: () => void;
}

export function BoostPointsPromo({ onShowBoosts }: BoostPointsPromoProps) {
  return (
    <div className="border-line bg-surface-raised flex items-center gap-4 rounded-2xl border p-4">
      <span className="bg-surface-input flex size-12 shrink-0 items-center justify-center rounded-xl">
        <BoostActionIcon size={28} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-content text-sm font-bold">
          {BOOST_POINTS_PROMO_COPY.title}
        </p>
        <p className="text-content-subtle mt-0.5 text-xs leading-snug">
          {BOOST_POINTS_PROMO_COPY.description}
        </p>
      </div>
      <button
        type="button"
        onClick={onShowBoosts}
        className="text-accent-strong shrink-0 cursor-pointer text-sm font-semibold hover:underline"
      >
        {BOOST_POINTS_PROMO_COPY.cta}
      </button>
    </div>
  );
}
