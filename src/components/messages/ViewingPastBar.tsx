"use client";

import {
  JUMP_TO_PRESENT_LABEL,
  VIEWING_OLDER_MESSAGES,
} from "@discordia/client-shared";
import { ArrowDown } from "lucide-react";

import { cn } from "@/lib/cn";

import { FloatingPill, PILL_CLASS } from "./FloatingPill";

/**
 * Globito sobre el composer mientras se ve un tramo del pasado del canal.
 * Todo el globito es el boton para volver al presente.
 */
export function ViewingPastBar({
  onJumpToPresent,
}: {
  onJumpToPresent: () => void;
}) {
  return (
    <FloatingPill position="bottom">
      <button
        type="button"
        onClick={onJumpToPresent}
        className={cn(
          PILL_CLASS,
          "hover:border-line-strong focus-visible:ring-accent-strong pointer-events-auto cursor-pointer transition-colors [--pill-from:6px] focus-visible:ring-2 focus-visible:outline-none",
        )}
      >
        <span className="text-content-muted hidden truncate sm:inline">
          {VIEWING_OLDER_MESSAGES}
        </span>
        <span className="text-accent-strong inline-flex shrink-0 items-center gap-1 font-semibold">
          {JUMP_TO_PRESENT_LABEL}
          <ArrowDown size={13} aria-hidden />
        </span>
      </button>
    </FloatingPill>
  );
}
