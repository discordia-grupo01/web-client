"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Aspecto comun de los globitos del chat (conexion, mensajes anteriores). */
export const PILL_CLASS =
  "pill-in bg-surface-hover/95 border-line text-content flex max-w-full items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs shadow-lg backdrop-blur";

interface FloatingPillProps {
  /** Arriba del chat o abajo, sobre el composer. */
  position: "top" | "bottom";
  children: ReactNode;
}

/**
 * Ubica un globito flotando sobre los mensajes, centrado y sin empujarlos: el
 * contenedor no ocupa alto y solo el globito recibe clicks.
 */
export function FloatingPill({ position, children }: FloatingPillProps) {
  return (
    <div className="pointer-events-none relative z-10 h-0 shrink-0">
      <div
        className={cn(
          "absolute inset-x-0 flex justify-center px-4",
          position === "top" ? "top-3" : "bottom-3",
        )}
      >
        {children}
      </div>
    </div>
  );
}
