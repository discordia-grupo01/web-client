import { ATTACHMENT_PREMIUM_OFFER_COPY } from "@discordia/client-shared";

import { DiscordiaPremiumIcon } from "@/components/billing/icons/DiscordiaIcons";

interface AttachmentPremiumOfferProps {
  onOpenPremium: () => void;
}

/** En un DM no hay boosts: el único camino para subir más es Premium. */
export function AttachmentPremiumOffer({
  onOpenPremium,
}: AttachmentPremiumOfferProps) {
  return (
    <div className="bg-surface-modal border-amber/30 mt-2 flex flex-col gap-2 rounded-xl border px-3.5 py-3">
      <div>
        <strong className="text-content block text-[13px]">
          {ATTACHMENT_PREMIUM_OFFER_COPY.title}
        </strong>
        <span className="text-content-muted mt-0.5 block text-xs leading-relaxed">
          {ATTACHMENT_PREMIUM_OFFER_COPY.detail}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenPremium}
        className="text-amber inline-flex cursor-pointer items-center gap-1 self-start text-xs font-bold hover:underline"
      >
        <DiscordiaPremiumIcon size={14} />
        {ATTACHMENT_PREMIUM_OFFER_COPY.cta}
      </button>
    </div>
  );
}
