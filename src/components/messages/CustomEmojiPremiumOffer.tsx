import {
  CUSTOM_EMOJI_PREMIUM_OFFER_COPY,
  CUSTOM_EMOJI_REACTION_OFFER_COPY,
} from "@discordia/client-shared";

import { DiscordiaPremiumIcon } from "@/components/billing/icons/DiscordiaIcons";
import { cn } from "@/lib/cn";

/** Dónde se quiso usar el emoji. Cambia el texto, nunca el estilo. */
export type CustomEmojiOfferVariant = "compose" | "reaction";

const COPY = {
  compose: CUSTOM_EMOJI_PREMIUM_OFFER_COPY,
  reaction: CUSTOM_EMOJI_REACTION_OFFER_COPY,
} as const;

interface CustomEmojiPremiumOfferProps {
  onOpenPremium: () => void;
  variant?: CustomEmojiOfferVariant;
  className?: string;
}

export function CustomEmojiPremiumOffer({
  onOpenPremium,
  variant = "compose",
  className,
}: CustomEmojiPremiumOfferProps) {
  const copy = COPY[variant];

  return (
    <div
      className={cn(
        "bg-surface-modal mt-2 flex flex-col gap-2 rounded-xl border border-[#F0B232]/30 px-3.5 py-3",
        className,
      )}
    >
      <div>
        <strong className="text-content block text-[13px]">{copy.title}</strong>
        <span className="text-content-muted mt-0.5 block text-xs leading-relaxed">
          {copy.detail}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenPremium}
        className="inline-flex cursor-pointer items-center gap-1 self-start text-xs font-bold text-[#F0B232] hover:underline"
      >
        <DiscordiaPremiumIcon size={14} />
        {copy.cta}
      </button>
    </div>
  );
}
