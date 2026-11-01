"use client";

import type { ReactNode } from "react";

import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";

export function TileBadge({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "danger" | "sky";
  children: ReactNode;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "rounded p-0.5",
        tone === "danger"
          ? "bg-danger/25 text-danger"
          : "bg-accent/70 text-white",
      )}
    >
      {children}
    </span>
  );
}

/** Boton chico sobre una esquina del tile. No fija el tile ni lo selecciona. */
export function TileCornerButton({
  label,
  ariaLabel,
  isCompact,
  isPressed,
  isDanger = false,
  onClick,
  children,
}: {
  label: string;
  ariaLabel: string;
  isCompact: boolean;
  isPressed?: boolean;
  isDanger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip label={label} align="end">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        onDoubleClick={(event) => event.stopPropagation()}
        aria-label={ariaLabel}
        aria-pressed={isPressed}
        className={cn(
          "flex cursor-pointer items-center justify-center rounded-lg backdrop-blur transition-colors",
          "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
          isCompact ? "size-7" : "size-8 pointer-coarse:size-10",
          isDanger
            ? "bg-danger/20 text-danger hover:bg-danger/30"
            : "bg-black/35 text-white hover:bg-black/50",
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}
