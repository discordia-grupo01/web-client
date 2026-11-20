import {
  ATTACHMENT_BOOST_OFFER_COPY,
  type BoostLevel,
} from "@discordia/client-shared";

import { DiscordiaPremiumIcon } from "@/components/billing/icons/DiscordiaIcons";
import { BoostBenefitChip } from "@/components/boosts/benefits/BoostBenefitChip";

interface AttachmentBoostOfferProps {
  level: BoostLevel;
  boostCount: number;
  onShowBenefits: () => void;
  onOpenPremium: () => void;
}

export function AttachmentBoostOffer({
  level,
  boostCount,
  onShowBenefits,
  onOpenPremium,
}: AttachmentBoostOfferProps) {
  return (
    <div className="border-line bg-surface-modal mt-2 flex flex-col gap-2 rounded-xl border px-3.5 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <strong className="text-content block text-[13px]">
            {ATTACHMENT_BOOST_OFFER_COPY.title}
          </strong>
          <span className="text-content-muted mt-0.5 block text-xs leading-relaxed">
            {ATTACHMENT_BOOST_OFFER_COPY.detail}
          </span>
        </div>
        <BoostBenefitChip
          perk="larger_attachments"
          level={level}
          boostCount={boostCount}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs font-semibold">
        <button
          type="button"
          onClick={onShowBenefits}
          className="text-info cursor-pointer hover:underline"
        >
          {ATTACHMENT_BOOST_OFFER_COPY.benefits}
        </button>
        <span className="text-content-subtle inline-flex items-center gap-1">
          {ATTACHMENT_BOOST_OFFER_COPY.premiumLead}
          <button
            type="button"
            onClick={onOpenPremium}
            className="text-amber inline-flex cursor-pointer items-center gap-1 font-bold hover:underline"
          >
            <DiscordiaPremiumIcon size={14} />
            {ATTACHMENT_BOOST_OFFER_COPY.premium}
          </button>
        </span>
      </div>
    </div>
  );
}
