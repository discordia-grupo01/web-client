"use client";

import {
  voiceHiddenCount,
  voiceHiddenCountLabel,
  type VoiceParticipant,
} from "@discordia/client-shared";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

const PREVIEW_AVATARS = 3;

interface VoiceOverflowTileProps {
  hidden: readonly VoiceParticipant[];
  width: number;
  height: number;
  onPress: () => void;
}

/** El ultimo lugar de la grilla cuando no entran todos: abre la lista. */
export function VoiceOverflowTile({
  hidden,
  width,
  height,
  onPress,
}: VoiceOverflowTileProps) {
  const avatarSize = Math.round(Math.min(36, Math.max(20, height * 0.3)));

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={voiceHiddenCountLabel(hidden.length)}
      className={cn(
        "bg-surface-raised border-line-strong text-content hover:bg-surface-hover flex shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden border-2 transition-colors",
        "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
        width < 200 ? "rounded-xl" : "rounded-2xl",
      )}
      style={{ width, height }}
    >
      <span aria-hidden className="flex">
        {hidden.slice(0, PREVIEW_AVATARS).map((participant) => (
          <Avatar
            key={participant.identity}
            name={participant.name}
            size={avatarSize}
            className="border-surface-raised -ml-2.5 rounded-full border-2 first:ml-0"
          />
        ))}
      </span>
      <span className="font-display text-sm font-bold">
        {voiceHiddenCount(hidden.length)}
      </span>
    </button>
  );
}
