import { CUSTOM_EMOJI_PICKER_COPY } from "@discordia/client-shared";

import { DiscordiaPremiumIcon } from "@/components/billing/icons/DiscordiaIcons";

/**
 * Pie del selector cuando hay emojis que la persona no puede usar: explica por
 * qué están marcados y lleva a Premium. Va afuera de emoji-mart, que dibuja en
 * su propio shadow DOM.
 */
export function EmojiPickerPremiumNote({
  onOpenPremium,
}: {
  onOpenPremium: () => void;
}) {
  return (
    <div className="bg-surface-modal border-line flex items-center justify-between gap-3 rounded-b-xl border-t px-3 py-2.5">
      <span className="text-content-muted flex items-center gap-2 text-xs leading-snug">
        <DiscordiaPremiumIcon size={16} />
        {CUSTOM_EMOJI_PICKER_COPY.note}
      </span>
      <button
        type="button"
        onClick={onOpenPremium}
        className="shrink-0 cursor-pointer text-xs font-bold text-[#F0B232] hover:underline"
      >
        {CUSTOM_EMOJI_PICKER_COPY.cta}
      </button>
    </div>
  );
}
