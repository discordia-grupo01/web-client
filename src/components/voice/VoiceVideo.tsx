"use client";

import type { Track } from "livekit-client";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

/** Muestra un track de video de LiveKit (camara o pantalla compartida). */
export function VoiceVideo({
  track,
  isMirrored = false,
  fit,
  hasBackdrop = false,
  onAspectRatioChange,
}: {
  track: Track;
  /** La camara propia se ve espejada, como en un espejo. */
  isMirrored?: boolean;
  fit: "cover" | "contain";
  hasBackdrop?: boolean;
  onAspectRatioChange?: (aspectRatio: number) => void;
}) {
  return (
    <>
      {hasBackdrop ? (
        <AttachedVideo
          track={track}
          isDecorative
          className="scale-110 object-cover blur-2xl brightness-50"
        />
      ) : null}
      <AttachedVideo
        track={track}
        onAspectRatioChange={onAspectRatioChange}
        className={cn(
          fit === "cover" ? "object-cover" : "object-contain",
          !hasBackdrop && "bg-black",
          isMirrored && "-scale-x-100",
        )}
      />
    </>
  );
}

function AttachedVideo({
  track,
  className,
  isDecorative = false,
  onAspectRatioChange,
}: {
  track: Track;
  className: string;
  isDecorative?: boolean;
  onAspectRatioChange?: (aspectRatio: number) => void;
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

  const reportAspectRatio = onAspectRatioChange
    ? () => {
        const element = videoRef.current;
        if (!element || element.videoWidth <= 0 || element.videoHeight <= 0) {
          return;
        }
        onAspectRatioChange(element.videoWidth / element.videoHeight);
      }
    : undefined;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      aria-hidden={isDecorative || undefined}
      onLoadedMetadata={reportAspectRatio}
      onResize={reportAspectRatio}
      className={cn("absolute inset-0 size-full", className)}
    />
  );
}
