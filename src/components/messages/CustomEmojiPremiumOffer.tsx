import {
  CUSTOM_EMOJI_PREMIUM_OFFER_COPY,
  CUSTOM_EMOJI_REACTION_OFFER_COPY,
} from "@discordia/client-shared";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

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
  onClose?: () => void;
}

export function CustomEmojiPremiumOffer({
  onOpenPremium,
  variant = "compose",
  className,
  onClose,
}: CustomEmojiPremiumOfferProps) {
  const copy = COPY[variant];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onClose) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-surface-modal border-amber/30 relative mt-2 flex flex-col gap-2 rounded-xl border px-3.5 py-3",
        className,
      )}
    >
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar oferta"
          className="text-content-muted hover:text-content absolute top-2.5 right-2.5 cursor-pointer rounded-md p-1 transition-colors"
        >
          <X size={14} />
        </button>
      ) : null}
      <div className={onClose ? "pr-6" : undefined}>
        <strong className="text-content block text-[13px]">{copy.title}</strong>
        <span className="text-content-muted mt-0.5 block text-xs leading-relaxed">
          {copy.detail}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenPremium}
        className="text-amber inline-flex cursor-pointer items-center gap-1 self-start text-xs font-bold hover:underline"
      >
        <DiscordiaPremiumIcon size={14} />
        {copy.cta}
      </button>
    </div>
  );
}
