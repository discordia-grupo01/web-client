"use client";

import type { VoiceParticipant } from "@discordia/client-shared";

import { useElementSize } from "@/components/voice/hooks/useElementSize";
import { cn } from "@/lib/cn";
import type { TileVideo } from "@/utils/livekitParticipants";
import {
  NARROW_GRID,
  NARROW_GRID_BREAKPOINT,
  voiceGridLayout,
  WIDE_GRID,
} from "@/components/voice/utils/voiceGrid";

import { VoiceFocusLayout, type RenderTile } from "./VoiceFocusLayout";
import { VoiceOverflowTile } from "./VoiceOverflowTile";
import { VoiceParticipantTile } from "./VoiceParticipantTile";
import { useVisibleParticipants } from "@/components/voice/hooks/useVisibleParticipants";

interface VoiceParticipantGridProps {
  participants: readonly VoiceParticipant[];
  isConnecting: boolean;
  ownAvatarSrc: string | null;
  videoOf: (identity: string) => TileVideo | null;
  onToggleMutedForMe: (identity: string) => void;
  onShowParticipants: () => void;
  pinnedIdentity: string | null;
  onPinChange?: (identity: string | null) => void;
  /** En mobile tocar un tile abre la lista, asi que ahi no se fija con doble toque. */
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

  const focus =
    participants.find(
      (participant) => participant.identity === pinnedIdentity,
    ) ?? null;

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
          onPinChange && !onTilePress
            ? () => onPinChange(identity === pinnedIdentity ? null : identity)
            : undefined
        }
        onPress={onTilePress}
      />
    );
  };

  const backToGrid = focus && onPinChange ? () => onPinChange(null) : undefined;

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
