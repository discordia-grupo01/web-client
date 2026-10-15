"use client";

import {
  VOICE_CAMERA_ON_LABEL,
  VOICE_MUTE_FOR_ME,
  VOICE_MUTED_FOR_ME_LABEL,
  VOICE_MUTED_LABEL,
  VOICE_SCREEN_SHARING,
  VOICE_SPEAKING_LABEL,
  VOICE_UNMUTE_FOR_ME,
  type VoiceParticipant,
} from "@discordia/client-shared";

import type { Track } from "livekit-client";
import { MicOff, MonitorUp, Video, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";

import { Tooltip } from "@/components/ui/Tooltip";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

import { VoiceVideo } from "./VoiceVideo";

const SPEAKING_BAR_HEIGHTS = [4, 7, 11, 7, 4];

interface VoiceParticipantTileProps {
  participant: VoiceParticipant;
  avatarSrc?: string | null;
  /** Pantalla compartida o camara, en ese orden de prioridad. */
  video?: { track: Track; source: "camera" | "screen" } | null;
  /** Solo para los demas: el tuyo no se puede silenciar para vos. */
  onToggleMutedForMe?: () => void;
}

export function VoiceParticipantTile({
  participant,
  avatarSrc,
  video = null,
  onToggleMutedForMe,
}: VoiceParticipantTileProps) {
  const { name, speaking, muted, cameraOn, screenSharing, mutedForMe } =
    participant;
  const isSpeaking = speaking && !mutedForMe;
  const muteForMeLabel = mutedForMe ? VOICE_UNMUTE_FOR_ME : VOICE_MUTE_FOR_ME;

  return (
    <div
      className={cn(
        "group bg-surface-raised border-line relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border-2 transition-colors",
        isSpeaking && "speaking-glow",
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--accent) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {video ? (
        <VoiceVideo
          track={video.track}
          fit={video.source === "screen" ? "contain" : "cover"}
          isMirrored={participant.isLocal && video.source === "camera"}
        />
      ) : null}

      <div
        className={cn(
          "relative rounded-full transition-[box-shadow,opacity]",
          video && "hidden",
          mutedForMe && "opacity-50",
        )}
        style={{
          boxShadow: isSpeaking
            ? "0 0 32px color-mix(in srgb, var(--success) 35%, transparent)"
            : "0 8px 24px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Avatar
          name={name}
          src={avatarSrc}
          size={56}
          className="rounded-full sm:hidden"
        />
        <Avatar
          name={name}
          src={avatarSrc}
          size={88}
          className="hidden rounded-full sm:flex"
        />
      </div>

      {screenSharing ? (
        <span className="bg-accent text-on-accent absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          <MonitorUp size={11} />
          {VOICE_SCREEN_SHARING}
        </span>
      ) : null}

      {onToggleMutedForMe ? (
        <span
          className={cn(
            "absolute top-2 right-2 transition-opacity",
            mutedForMe
              ? "opacity-100"
              : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100",
          )}
        >
          <Tooltip label={muteForMeLabel} align="end">
            <button
              type="button"
              onClick={onToggleMutedForMe}
              aria-label={`${muteForMeLabel}: ${name}`}
              aria-pressed={mutedForMe}
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded-lg backdrop-blur transition-colors pointer-coarse:size-10",
                "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
                mutedForMe
                  ? "bg-danger/20 text-danger hover:bg-danger/30"
                  : "bg-black/35 text-white hover:bg-black/50",
              )}
            >
              {mutedForMe ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </Tooltip>
        </span>
      ) : null}

      {isSpeaking ? (
        <div
          aria-hidden
          className="absolute bottom-12 left-1/2 flex h-3 -translate-x-1/2 items-end gap-0.5 sm:bottom-14"
        >
          {SPEAKING_BAR_HEIGHTS.map((height, index) => (
            <span
              key={index}
              className="bg-success speaking-bar w-1 rounded-full opacity-80"
              style={{ height, animationDelay: `${index * 0.12}s` }}
            />
          ))}
        </div>
      ) : null}

      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 py-2"
        style={{
          background:
            "linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 100%)",
        }}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {isSpeaking ? (
            <span
              role="img"
              aria-label={VOICE_SPEAKING_LABEL}
              className="bg-success size-2 shrink-0 rounded-full"
            />
          ) : null}
          <span className="font-display truncate text-sm font-semibold text-white">
            {name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {mutedForMe ? (
            <TileBadge label={VOICE_MUTED_FOR_ME_LABEL} tone="danger">
              <VolumeX size={12} />
            </TileBadge>
          ) : null}
          {muted ? (
            <TileBadge label={VOICE_MUTED_LABEL} tone="danger">
              <MicOff size={12} />
            </TileBadge>
          ) : null}
          {cameraOn ? (
            <TileBadge label={VOICE_CAMERA_ON_LABEL} tone="sky">
              <Video size={12} />
            </TileBadge>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TileBadge({
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
