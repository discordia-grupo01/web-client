"use client";

import {
  ADD_REACTION_LABEL,
  type MessageReaction,
} from "@discordia/client-shared";

import { SmilePlus } from "lucide-react";

import { EmojiPicker } from "./EmojiPicker";
import { ReactionChip } from "./ReactionChip";

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
  /** Sin `ADD_REACTIONS`: solo se puede sacar la reaccion propia (CA2/CA3). */
  canAdd?: boolean;
}

export function MessageReactions({
  reactions,
  onToggle,
  canAdd = true,
}: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {reactions.map((reaction) => (
        <ReactionChip
          key={reaction.emoji}
          reaction={reaction}
          onToggle={() => onToggle(reaction.emoji)}
          disabled={!canAdd && !reaction.reacted_by_me}
        />
      ))}
      {canAdd ? (
        <EmojiPicker
          icon={SmilePlus}
          label={ADD_REACTION_LABEL}
          onPick={onToggle}
          iconSize={13}
          align="left"
          triggerClassName="border-line text-content-subtle hover:text-content hover:border-accent flex h-[22px] items-center rounded-full border px-2"
        />
      ) : null}
    </div>
  );
}
