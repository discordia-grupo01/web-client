"use client";

import type { VoiceParticipant } from "@discordia/client-shared";

import { useState } from "react";

import { useElementSize } from "@/hooks/useElementSize";
import { cn } from "@/lib/cn";
import type { TileVideo } from "@/services/voice/livekitParticipants";
import {
  NARROW_GRID,
  NARROW_GRID_BREAKPOINT,
  voiceGridLayout,
  WIDE_GRID,
} from "@/lib/voiceGrid";

import { VoiceFocusLayout, type RenderTile } from "./VoiceFocusLayout";
import { VoiceOverflowTile } from "./VoiceOverflowTile";
import { VoiceParticipantTile } from "./VoiceParticipantTile";
import { useVisibleParticipants } from "./useVisibleParticipants";

interface VoiceParticipantGridProps {
  participants: readonly VoiceParticipant[];
  isConnecting: boolean;
  ownAvatarSrc: string | null;
  videoOf: (identity: string) => TileVideo | null;
  onToggleMutedForMe: (identity: string) => void;
  onShowParticipants: () => void;
  pinnedIdentity: string | null;
  /** Sin esto no se fija con doble click (en mobile se fija desde la lista). */
  onPinChange?: (identity: string | null) => void;
  /** En mobile tocar un tile abre la lista de participantes. */
  onTilePress?: () => void;
}

export function VoiceParticipantGrid({
  participants,
  isConnecting,
  ownAvatarSrc,
  videoOf,
  onToggleMutedForMe,
  onShowParticipants,
  pinnedIdentity,
  onPinChange,
  onTilePress,
}: VoiceParticipantGridProps) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const isNarrow = size.width < NARROW_GRID_BREAKPOINT;
  const options = isNarrow ? NARROW_GRID : WIDE_GRID;

  const sharer = participants.find((participant) => participant.screenSharing);
  const [dismissedSharer, setDismissedSharer] = useState<string | null>(null);
  if (dismissedSharer !== null && sharer?.identity !== dismissedSharer) {
    setDismissedSharer(null);
  }
  const pinned = participants.find(
    (participant) => participant.identity === pinnedIdentity,
  );
  const focus =
    pinned ?? (sharer && sharer.identity !== dismissedSharer ? sharer : null);

  const layout = voiceGridLayout(
    size.width,
    size.height,
    participants.length,
    options,
  );
  const hasOverflow = layout.capacity < participants.length;
  const visible = useVisibleParticipants(
    participants,
    hasOverflow ? layout.capacity - 1 : participants.length,
  );
  const visibleIds = new Set(
    visible.map((participant) => participant.identity),
  );
  const hidden = participants.filter(
    (participant) => !visibleIds.has(participant.identity),
  );

  const renderTile: RenderTile = (participant, width, height) => {
    const { identity, isLocal } = participant;
    return (
      <VoiceParticipantTile
        key={identity}
        participant={participant}
        width={width}
        height={height}
        avatarSrc={isLocal ? ownAvatarSrc : null}
        video={videoOf(identity)}
        onToggleMutedForMe={
          isLocal ? undefined : () => onToggleMutedForMe(identity)
        }
        onTogglePin={
          onPinChange
            ? () => onPinChange(identity === pinnedIdentity ? null : identity)
            : undefined
        }
        onPress={onTilePress}
      />
    );
  };

  const backToGrid = !focus
    ? undefined
    : focus === pinned
      ? onPinChange && (() => onPinChange(null))
      : () => setDismissedSharer(focus.identity);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2 md:p-4",
        isConnecting && "opacity-60",
      )}
    >
      {size.width === 0 ? null : focus ? (
        <VoiceFocusLayout
          focus={focus}
          others={participants.filter(
            (participant) => participant.identity !== focus.identity,
          )}
          size={size}
          isNarrow={isNarrow}
          renderTile={renderTile}
          onShowParticipants={onShowParticipants}
          onBackToGrid={backToGrid}
        />
      ) : (
        <div
          className="flex flex-wrap content-center justify-center"
          style={{
            gap: options.gap,
            width:
              layout.columns * layout.tileWidth +
              (layout.columns - 1) * options.gap,
          }}
        >
          {visible.map((participant) =>
            renderTile(participant, layout.tileWidth, layout.tileHeight),
          )}
          {hasOverflow ? (
            <VoiceOverflowTile
              hidden={hidden}
              width={layout.tileWidth}
              height={layout.tileHeight}
              onPress={onShowParticipants}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
