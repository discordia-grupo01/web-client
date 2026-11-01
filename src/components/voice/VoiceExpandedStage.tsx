"use client";

import type { TileVideo } from "@/utils/livekitParticipants";

import { VoiceVideo } from "./VoiceVideo";

export function VoiceExpandedStage({
  name,
  video,
  isMirrored,
}: {
  name: string;
  video: TileVideo;
  isMirrored: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={name}
      className="relative min-h-0 flex-1 bg-black"
    >
      <VoiceVideo track={video.track} fit="contain" isMirrored={isMirrored} />
    </div>
  );
}
