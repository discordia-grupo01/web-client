import type { MessageReaction } from "@discordia/client-shared";

import { cn } from "@/lib/cn";

interface ReactionChipProps {
  reaction: MessageReaction;
  onToggle: () => void;
}

export function ReactionChip({ reaction, onToggle }: ReactionChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={reaction.reacted_by_me}
      aria-label={`${reaction.emoji} ${reaction.count}`}
      className={cn(
        "flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
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
