import type { MessageReaction } from "@discordia/client-shared";

import { cn } from "@/lib/cn";

interface ReactionChipProps {
  reaction: MessageReaction;
  onToggle: () => void;
  /** Sin permiso para reaccionar: se ve, pero no se puede sumar a la reaccion. */
  disabled?: boolean;
}

export function ReactionChip({
  reaction,
  onToggle,
  disabled = false,
}: ReactionChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={reaction.reacted_by_me}
      aria-label={`${reaction.emoji} ${reaction.count}`}
      className={cn(
        "disabled:hover:border-line flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:cursor-default",
        reaction.reacted_by_me
          ? "border-accent bg-accent/15"
          : "border-line bg-surface-input hover:border-accent",
      )}
    >
      <span>{reaction.emoji}</span>
      <span className="text-content-muted font-medium tabular-nums">
        {reaction.count}
      </span>
    </button>
  );
}
