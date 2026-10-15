"use client";

import {
  VOICE_BACK_TO_GRID,
  type VoiceParticipant,
} from "@discordia/client-shared";

import { LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";

import type { ElementSize } from "@/hooks/useElementSize";
import { cn } from "@/lib/cn";
import { voiceFocusLayout } from "@/lib/voiceGrid";

import { VoiceOverflowTile } from "./VoiceOverflowTile";
import { useVisibleParticipants } from "./useVisibleParticipants";

const GAP = 8;
const BACK_ROW_HEIGHT = 40;

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

export function VoiceFocusLayout({
  focus,
  others,
  size,
  isNarrow,
  renderTile,
  onShowParticipants,
  onBackToGrid,
}: VoiceFocusLayoutProps) {
  const backRow = isNarrow && onBackToGrid ? BACK_ROW_HEIGHT : 0;
  const layout = voiceFocusLayout(
    size.width,
    size.height - backRow,
    others.length,
    isNarrow,
  );
  const hasOverflow = others.length > layout.capacity;
  const visible = useVisibleParticipants(
    others,
    hasOverflow ? layout.capacity - 1 : others.length,
  );
  const visibleIds = new Set(
    visible.map((participant) => participant.identity),
  );
  const hidden = others.filter(
    (participant) => !visibleIds.has(participant.identity),
  );

  const backButton = onBackToGrid ? (
    <button
      type="button"
      onClick={onBackToGrid}
      className={cn(
        "bg-surface-raised/90 border-line-strong text-content hover:bg-surface-hover flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold backdrop-blur transition-colors",
        !isNarrow && "absolute top-2 left-1/2 -translate-x-1/2",
      )}
    >
      <LayoutGrid size={14} />
      {VOICE_BACK_TO_GRID}
    </button>
  ) : null;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        layout.mode !== "side" && "flex-col",
      )}
      style={{ gap: GAP }}
    >
      {isNarrow ? backButton : null}

      <div
        className="relative shrink-0"
        style={{ width: layout.stageWidth, height: layout.stageHeight }}
      >
        {renderTile(focus, layout.stageWidth, layout.stageHeight)}
        {isNarrow ? null : backButton}
      </div>

      {others.length > 0 ? (
        <div
          className={cn(
            "flex shrink-0 flex-wrap content-center justify-center",
            layout.mode === "side" && "flex-col",
          )}
          style={{
            gap: GAP,
            width:
              layout.mode === "stacked"
                ? layout.columns * layout.tileWidth + (layout.columns - 1) * GAP
                : undefined,
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
      ) : null}
    </div>
  );
}
