"use client";

import {
  isScreenShareIdentity,
  voiceTilesOf,
  type VoiceParticipant,
} from "@discordia/client-shared";

import { useCallback, useState } from "react";

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
  /** Las personas de la llamada; la grilla le agrega un tile a cada pantalla. */
  participants: readonly VoiceParticipant[];
  isConnecting: boolean;
  ownAvatarSrc: string | null;
  avatarSrcOf?: (identity: string) => string | null;
  videoOf: (identity: string) => TileVideo | null;
  onToggleMutedForMe: (identity: string) => void;
  onShowParticipants: () => void;
  pinnedIdentity: string | null;
  onPinChange?: (identity: string | null) => void;
  /** En mobile un toque abre la lista y el doble toque fija al participante. */
  onTilePress?: () => void;
  /** Boton de pantalla grande en los tiles con video. */
  canExpand?: boolean;
  onExpand?: (identity: string) => void;
}

export function VoiceParticipantGrid({
  participants: people,
  isConnecting,
  ownAvatarSrc,
  avatarSrcOf,
  videoOf,
  onToggleMutedForMe,
  onShowParticipants,
  pinnedIdentity,
  onPinChange,
  onTilePress,
  canExpand = true,
  onExpand,
}: VoiceParticipantGridProps) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const isNarrow = size.width < NARROW_GRID_BREAKPOINT;
  const options = isNarrow ? NARROW_GRID : WIDE_GRID;
  const participants = voiceTilesOf(people);
  const [aspectRatios, setAspectRatios] = useState<
    Readonly<Record<string, number>>
  >({});
  const rememberAspectRatio = useCallback(
    (identity: string, aspectRatio: number) =>
      setAspectRatios((current) =>
        current[identity] === aspectRatio
          ? current
          : { ...current, [identity]: aspectRatio },
      ),
    [],
  );

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

  const avatarOf = (participant: VoiceParticipant) =>
    participant.isLocal
      ? ownAvatarSrc
      : (avatarSrcOf?.(participant.identity) ?? null);

  const renderTile: RenderTile = (participant, width, height) => {
    const { identity, isLocal } = participant;
    return (
      <VoiceParticipantTile
        key={identity}
        participant={participant}
        width={width}
        height={height}
        avatarSrc={avatarOf(participant)}
        video={videoOf(identity)}
        onToggleMutedForMe={
          isLocal || isScreenShareIdentity(identity)
            ? undefined
            : () => onToggleMutedForMe(identity)
        }
        onTogglePin={
          onPinChange
            ? () => onPinChange(identity === pinnedIdentity ? null : identity)
            : undefined
        }
        onPress={onTilePress}
        canExpand={canExpand}
        onExpand={onExpand ? () => onExpand(identity) : undefined}
        onVideoAspectRatioChange={(aspectRatio) =>
          rememberAspectRatio(identity, aspectRatio)
        }
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
          avatarSrcOf={avatarOf}
          onShowParticipants={onShowParticipants}
          onBackToGrid={backToGrid}
          stageAspect={
            isScreenShareIdentity(focus.identity)
              ? aspectRatios[focus.identity]
              : undefined
          }
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
              avatarSrcOf={avatarOf}
              onPress={onShowParticipants}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
