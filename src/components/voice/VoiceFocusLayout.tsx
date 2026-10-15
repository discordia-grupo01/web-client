"use client";

import {
  VOICE_BACK_TO_GRID,
  type VoiceParticipant,
} from "@discordia/client-shared";

import { LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";

import type { ElementSize } from "@/hooks/useElementSize";
import { stripCapacity, VOICE_TILE_ASPECT } from "@/lib/voiceGrid";

import { VoiceOverflowTile } from "./VoiceOverflowTile";
import { useVisibleParticipants } from "./useVisibleParticipants";

const GAP = 8;
const SIDE_STRIP_MIN_WIDTH = 900;
const SIDE_STRIP_TILE_WIDTH = 176;
const BOTTOM_STRIP_TILE_HEIGHT = { narrow: 56, wide: 90 } as const;

export type RenderTile = (
  participant: VoiceParticipant,
  width: number,
  height: number,
) => ReactNode;

interface VoiceFocusLayoutProps {
  focus: VoiceParticipant;
  others: readonly VoiceParticipant[];
  size: ElementSize;
  isNarrow: boolean;
  renderTile: RenderTile;
  onShowParticipants: () => void;
  onBackToGrid?: () => void;
}

/**
 * Alguien comparte pantalla o esta fijado: se ve en grande y el resto queda
 * en una tira chica, abajo o al costado, que tampoco scrollea.
 */
export function VoiceFocusLayout({
  focus,
  others,
  size,
  isNarrow,
  renderTile,
  onShowParticipants,
  onBackToGrid,
}: VoiceFocusLayoutProps) {
  const isSideStrip = !isNarrow && size.width >= SIDE_STRIP_MIN_WIDTH;
  const stripTile = isSideStrip
    ? {
        width: SIDE_STRIP_TILE_WIDTH,
        height: SIDE_STRIP_TILE_WIDTH / VOICE_TILE_ASPECT,
      }
    : {
        width:
          BOTTOM_STRIP_TILE_HEIGHT[isNarrow ? "narrow" : "wide"] *
          VOICE_TILE_ASPECT,
        height: BOTTOM_STRIP_TILE_HEIGHT[isNarrow ? "narrow" : "wide"],
      };

  const capacity = isSideStrip
    ? stripCapacity(size.height, stripTile.height, GAP)
    : stripCapacity(size.width, stripTile.width, GAP);
  const hasOverflow = others.length > capacity;
  const visible = useVisibleParticipants(
    others,
    hasOverflow ? capacity - 1 : others.length,
  );
  const visibleIds = new Set(
    visible.map((participant) => participant.identity),
  );
  const hidden = others.filter(
    (participant) => !visibleIds.has(participant.identity),
  );

  const stageWidth = isSideStrip
    ? size.width - stripTile.width - GAP
    : size.width;
  const stageHeight =
    isSideStrip || others.length === 0
      ? size.height
      : size.height - stripTile.height - GAP;
  const focusWidth = Math.max(
    0,
    Math.min(stageWidth, stageHeight * VOICE_TILE_ASPECT),
  );

  return (
    <div
      className={
        isSideStrip
          ? "flex h-full w-full items-center gap-2"
          : "flex h-full w-full flex-col items-center gap-2"
      }
    >
      <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center">
        {renderTile(focus, focusWidth, focusWidth / VOICE_TILE_ASPECT)}
        {onBackToGrid ? (
          <button
            type="button"
            onClick={onBackToGrid}
            className="bg-surface-raised/90 border-line-strong text-content hover:bg-surface-hover absolute top-2 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold backdrop-blur transition-colors"
          >
            <LayoutGrid size={14} />
            {VOICE_BACK_TO_GRID}
          </button>
        ) : null}
      </div>

      {others.length > 0 ? (
        <div
          className={
            isSideStrip
              ? "flex shrink-0 flex-col justify-center gap-2"
              : "flex shrink-0 justify-center gap-2"
          }
        >
          {visible.map((participant) =>
            renderTile(participant, stripTile.width, stripTile.height),
          )}
          {hasOverflow ? (
            <VoiceOverflowTile
              hidden={hidden}
              width={stripTile.width}
              height={stripTile.height}
              onPress={onShowParticipants}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
