"use client";

import {
  CUSTOM_EMOJI_REACTION_OFFER_COPY,
  emojiLabel,
  type MessageReaction,
  parseCustomEmojiTokens,
} from "@discordia/client-shared";

import { DiscordiaPremiumIcon } from "@/components/billing/icons/DiscordiaIcons";
import { useCustomEmoji } from "@/contexts/CustomEmojisContext";
import { cn } from "@/lib/cn";

import { CustomEmojiImage } from "./CustomEmojiImage";
import type { ReactionEmojis } from "./hooks/useReactionEmojis";

interface ReactionChipProps {
  reaction: MessageReaction;
  onToggle: () => void;
  /** Sin permiso para reaccionar: se ve, pero no se puede sumar a la reaccion. */
  disabled?: boolean;
  /** Las reglas de Premium del chat. Sin esto el chip no marca nada. */
  reactionEmojis?: ReactionEmojis;
  /** Se quiso sumar a una reacción que pide Premium: se ofrece en vez de mandar. */
  onNeedsPremium?: () => void;
}

export function ReactionChip({
  reaction,
  onToggle,
  disabled = false,
  reactionEmojis,
  onNeedsPremium,
}: ReactionChipProps) {
  // Una reacción es un emoji solo: o unicode, o un token `<:nombre:id>`.
  const [custom] = parseCustomEmojiTokens(reaction.emoji);
  const emoji = useCustomEmoji(custom?.id ?? null);

  /**
   * Sacar la reacción propia siempre se puede: Premium hace falta para sumarse,
   * no para deshacer. Mientras el emoji se está pidiendo (`undefined`) no se
   * marca nada; si al tocarlo todavía no llegó, lo frena el back.
   */
  const locked =
    !reaction.reacted_by_me &&
    emoji != null &&
    (reactionEmojis?.isLocked(emoji) ?? false) &&
    onNeedsPremium !== undefined;

  const label = custom ? emojiLabel(custom.name) : reaction.emoji;
  // `:festejo: · animado`, y debajo el motivo si no se puede sumar.
  const tooltip =
    custom && emoji ? reactionEmojis?.tooltip(emoji, custom.name) : undefined;

  return (
    <button
      type="button"
      onClick={locked ? onNeedsPremium : onToggle}
      disabled={disabled}
      aria-pressed={reaction.reacted_by_me}
      title={tooltip}
      aria-label={
        locked
          ? `${label} ${reaction.count} · ${CUSTOM_EMOJI_REACTION_OFFER_COPY.locked}`
          : `${label} ${reaction.count}`
      }
      className={cn(
        "disabled:hover:border-line flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:cursor-default",
        reaction.reacted_by_me
          ? "border-accent bg-accent/15"
          : locked
            ? "border-[#F0B232]/40 bg-surface-input hover:border-[#F0B232]"
            : "border-line bg-surface-input hover:border-accent",
      )}
    >
      <span>
        {custom ? (
          <CustomEmojiImage id={custom.id} name={custom.name} size={16} />
        ) : (
          reaction.emoji
        )}
      </span>
      <span className="text-content-muted font-medium tabular-nums">
        {reaction.count}
      </span>
      {locked ? <DiscordiaPremiumIcon size={11} /> : null}
    </button>
  );
}
