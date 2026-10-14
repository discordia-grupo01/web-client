"use client";

import type { VoiceParticipant } from "@discordia/client-shared";

import { cn } from "@/lib/cn";
import type { TileVideo } from "@/services/voice/livekitParticipants";

import { VoiceParticipantTile } from "./VoiceParticipantTile";

interface VoiceParticipantGridProps {
  participants: readonly VoiceParticipant[];
  isConnecting: boolean;
  ownAvatarSrc: string | null;
  videoOf: (identity: string) => TileVideo | null;
  onToggleMutedForMe: (identity: string) => void;
}

export function VoiceParticipantGrid({
  participants,
  isConnecting,
  ownAvatarSrc,
  videoOf,
  onToggleMutedForMe,
}: VoiceParticipantGridProps) {
  return (
    <div className="flex min-h-0 flex-1 overflow-y-auto p-3 md:p-8">
      <div
        className={cn(
          "m-auto grid w-full gap-4",
          participants.length === 1
            ? "max-w-2xl grid-cols-1"
            : "max-w-4xl grid-cols-1 sm:grid-cols-2",
          participants.length > 4 && "max-w-6xl xl:grid-cols-3",
          isConnecting && "opacity-60",
        )}
      >
        {participants.map((participant) => (
          <VoiceParticipantTile
            key={participant.identity}
            participant={participant}
            avatarSrc={participant.isLocal ? ownAvatarSrc : null}
            video={videoOf(participant.identity)}
            onToggleMutedForMe={
              participant.isLocal
                ? undefined
                : () => onToggleMutedForMe(participant.identity)
            }
          />
        ))}
      </div>
    </div>
  );
}
