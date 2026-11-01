"use client";

import {
  VOICE_FULLSCREEN_ESC_HINT,
  VOICE_FULLSCREEN_EXIT,
  VOICE_FULLSCREEN_EXIT_LABEL,
  VOICE_FULLSCREEN_HINT,
} from "@discordia/client-shared";

import { MonitorUp, Video, Volume2, X } from "lucide-react";

import { cn } from "@/lib/cn";

interface VoiceFullscreenOverlayProps {
  name: string;
  source: "camera" | "screen";
  /** Se oculta sin actividad para no tapar lo que se esta mostrando. */
  isVisible: boolean;
  onExit: () => void;
}

/** Lo que va encima del video en pantalla grande: quien es, salir y el aviso. */
export function VoiceFullscreenOverlay({
  name,
  source,
  isVisible,
  onExit,
}: VoiceFullscreenOverlayProps) {
  const SourceIcon = source === "screen" ? MonitorUp : Video;

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col justify-between transition-opacity duration-300",
        isVisible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        className="flex items-start justify-between gap-4 px-6 pt-5 pb-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, transparent 100%)",
        }}
      >
        <span className="font-display flex min-w-0 items-center gap-2 text-lg font-semibold text-white">
          <SourceIcon size={20} className="shrink-0" />
          <span className="truncate">{name}</span>
        </span>
        <button
          type="button"
          onClick={onExit}
          aria-label={VOICE_FULLSCREEN_EXIT_LABEL}
          className={cn(
            "flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-black/70",
            "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
          )}
        >
          <X size={18} />
          {VOICE_FULLSCREEN_EXIT}
        </button>
      </div>

      <p className="mx-auto mb-6 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white/85 backdrop-blur">
        <Volume2 size={16} className="shrink-0" />
        {VOICE_FULLSCREEN_HINT}
        <span aria-hidden>·</span>
        {VOICE_FULLSCREEN_ESC_HINT}
      </p>
    </div>
  );
}
