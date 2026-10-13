"use client";

import type { Track } from "livekit-client";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

/** Muestra un track de video de LiveKit (camara o pantalla compartida). */
export function VoiceVideo({
  track,
  isMirrored = false,
  fit,
}: {
  track: Track;
  /** La camara propia se ve espejada, como en un espejo. */
  isMirrored?: boolean;
  fit: "cover" | "contain";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={cn(
        "absolute inset-0 size-full bg-black",
        fit === "cover" ? "object-cover" : "object-contain",
        isMirrored && "-scale-x-100",
      )}
    />
  );
}
