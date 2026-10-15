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
/** Por debajo de esto el tile muestra solo avatar, nombre e iconos. */
const COMPACT_TILE_WIDTH = 200;
const MIN_AVATAR = 24;
const MAX_AVATAR = 88;

interface VoiceParticipantTileProps {
  participant: VoiceParticipant;
  width: number;
  height: number;
  avatarSrc?: string | null;
  /** Pantalla compartida o camara, en ese orden de prioridad. */
  video?: { track: Track; source: "camera" | "screen" } | null;
  /** Solo para los demas: el tuyo no se puede silenciar para vos. */
  onToggleMutedForMe?: () => void;
  onTogglePin?: () => void;
  onPress?: () => void;
}

export function VoiceParticipantTile({
  participant,
  width,
  height,
  avatarSrc,
  video = null,
  onToggleMutedForMe,
  onTogglePin,
  onPress,
}: VoiceParticipantTileProps) {
  const { name, speaking, muted, cameraOn, screenSharing, mutedForMe } =
    participant;
  const isSpeaking = speaking && !mutedForMe;
  const isCompact = width < COMPACT_TILE_WIDTH;
  const muteForMeLabel = mutedForMe ? VOICE_UNMUTE_FOR_ME : VOICE_MUTE_FOR_ME;
  const avatarSize = Math.round(
    Math.min(MAX_AVATAR, Math.max(MIN_AVATAR, height * 0.42)),
  );

  return (
    <div
      onClick={onPress}
      onDoubleClick={onTogglePin}
      className={cn(
        "group bg-surface-raised border-line relative flex shrink-0 items-center justify-center overflow-hidden border-2 transition-colors",
        isCompact ? "rounded-xl" : "rounded-2xl",
        isSpeaking && "speaking-glow",
        onPress && "cursor-pointer",
      )}
      style={{ width, height }}
    >
      {isCompact ? null : (
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--accent) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      )}

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
          size={avatarSize}
          className="rounded-full"
        />
      </div>

      {screenSharing && !isCompact ? (
        <span className="bg-accent text-on-accent absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          <MonitorUp size={11} />
          {VOICE_SCREEN_SHARING}
        </span>
      ) : null}

      {onToggleMutedForMe ? (
        <span
          className={cn(
            "absolute transition-opacity",
            isCompact ? "top-1 right-1" : "top-2 right-2",
            mutedForMe
              ? "opacity-100"
              : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100",
          )}
        >
          <Tooltip label={muteForMeLabel} align="end">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleMutedForMe();
              }}
              onDoubleClick={(event) => event.stopPropagation()}
              aria-label={`${muteForMeLabel}: ${name}`}
              aria-pressed={mutedForMe}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg backdrop-blur transition-colors",
                "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
                isCompact ? "size-7" : "size-8 pointer-coarse:size-10",
                mutedForMe
                  ? "bg-danger/20 text-danger hover:bg-danger/30"
                  : "bg-black/35 text-white hover:bg-black/50",
              )}
            >
              {mutedForMe ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </Tooltip>
        </span>
      ) : null}

      {isSpeaking && !isCompact ? (
        <div
          aria-hidden
          className="absolute bottom-12 left-1/2 flex h-3 -translate-x-1/2 items-end gap-0.5"
        >
          {SPEAKING_BAR_HEIGHTS.map((barHeight, index) => (
            <span
              key={index}
              className="bg-success speaking-bar w-1 rounded-full opacity-80"
              style={{ height: barHeight, animationDelay: `${index * 0.12}s` }}
            />
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center justify-between gap-1.5",
          isCompact ? "px-2 py-1" : "px-3 py-2",
        )}
        style={{
          background:
            "linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%)",
        }}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {isSpeaking ? (
            <span
              role="img"
              aria-label={VOICE_SPEAKING_LABEL}
              className={cn(
                "bg-success shrink-0 rounded-full",
                isCompact ? "size-1.5" : "size-2",
              )}
            />
          ) : null}
          <span
            className={cn(
              "font-display truncate font-semibold text-white",
              isCompact ? "text-[11px]" : "text-sm",
            )}
          >
            {name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {mutedForMe ? (
            <TileBadge label={VOICE_MUTED_FOR_ME_LABEL} tone="danger">
              <VolumeX size={isCompact ? 10 : 12} />
            </TileBadge>
          ) : null}
          {muted ? (
            <TileBadge label={VOICE_MUTED_LABEL} tone="danger">
              <MicOff size={isCompact ? 10 : 12} />
            </TileBadge>
          ) : null}
          {cameraOn ? (
            <TileBadge label={VOICE_CAMERA_ON_LABEL} tone="sky">
              <Video size={isCompact ? 10 : 12} />
            </TileBadge>
          ) : null}
          {screenSharing && isCompact ? (
            <TileBadge label={VOICE_SCREEN_SHARING} tone="sky">
              <MonitorUp size={10} />
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
