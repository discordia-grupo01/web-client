"use client";

import {
  VOICE_CAMERA_ON_LABEL,
  VOICE_MUTE_FOR_ME,
  VOICE_MUTED_FOR_ME_LABEL,
  VOICE_MUTED_LABEL,
  VOICE_PARTICIPANTS_CLOSE,
  VOICE_PARTICIPANTS_TITLE,
  VOICE_PIN,
  VOICE_SCREEN_SHARING,
  VOICE_UNMUTE_FOR_ME,
  VOICE_UNPIN,
  voiceConnectedCount,
  voiceParticipantName,
  voicePinLabel,
  voiceSidebarPreview,
  type VoiceParticipant,
} from "@discordia/client-shared";

import { MicOff, MonitorUp, Video, VolumeX, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

interface VoiceParticipantsPanelProps {
  participants: readonly VoiceParticipant[];
  ownAvatarSrc: string | null;
  pinnedIdentity: string | null;
  onToggleMutedForMe: (identity: string) => void;
  onPinChange: (identity: string | null) => void;
  onClose: () => void;
}

/** Todos los de la llamada: la grilla nunca scrollea, esta lista si. */
export function VoiceParticipantsPanel({
  participants,
  ownAvatarSrc,
  pinnedIdentity,
  onToggleMutedForMe,
  onPinChange,
  onClose,
}: VoiceParticipantsPanelProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const { shown } = voiceSidebarPreview(participants, participants.length);

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-end bg-black/40 sm:items-stretch"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-label={VOICE_PARTICIPANTS_TITLE}
        onClick={(event) => event.stopPropagation()}
        className="bg-surface-raised border-line-strong flex max-h-[80%] w-full flex-col rounded-t-2xl border-t shadow-2xl sm:max-h-none sm:w-80 sm:rounded-none sm:border-t-0 sm:border-l"
      >
        <header className="border-line flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-display text-content font-bold">
              {VOICE_PARTICIPANTS_TITLE}
            </h2>
            <p className="text-content-muted text-xs">
              {voiceConnectedCount(participants.length)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={VOICE_PARTICIPANTS_CLOSE}
            className="bg-surface-input text-content-muted hover:text-content flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {shown.map((participant) => (
            <ParticipantRow
              key={participant.identity}
              participant={participant}
              avatarSrc={participant.isLocal ? ownAvatarSrc : null}
              isPinned={participant.identity === pinnedIdentity}
              onToggleMutedForMe={() =>
                onToggleMutedForMe(participant.identity)
              }
              onTogglePin={() =>
                onPinChange(
                  participant.identity === pinnedIdentity
                    ? null
                    : participant.identity,
                )
              }
            />
          ))}
        </ul>
      </aside>
    </div>
  );
}

function ParticipantRow({
  participant,
  avatarSrc,
  isPinned,
  onToggleMutedForMe,
  onTogglePin,
}: {
  participant: VoiceParticipant;
  avatarSrc: string | null;
  isPinned: boolean;
  onToggleMutedForMe: () => void;
  onTogglePin: () => void;
}) {
  const {
    name,
    isLocal,
    speaking,
    muted,
    cameraOn,
    screenSharing,
    mutedForMe,
  } = participant;
  const muteForMeLabel = mutedForMe ? VOICE_UNMUTE_FOR_ME : VOICE_MUTE_FOR_ME;

  return (
    <li className="hover:bg-surface-hover flex items-center gap-3 rounded-xl px-2 py-2 transition-colors">
      <span className="relative shrink-0">
        <Avatar
          name={name}
          src={avatarSrc}
          size={36}
          className={cn("rounded-full", mutedForMe && "opacity-50")}
        />
        <span
          aria-hidden
          className={cn(
            "absolute -inset-0.5 rounded-full border-2 border-transparent",
            speaking && !mutedForMe && "border-success",
          )}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-content truncate text-sm font-semibold">
          {voiceParticipantName(name, isLocal)}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          {mutedForMe ? (
            <StatusIcon label={VOICE_MUTED_FOR_ME_LABEL} danger>
              <VolumeX size={12} />
            </StatusIcon>
          ) : null}
          {muted ? (
            <StatusIcon label={VOICE_MUTED_LABEL} danger>
              <MicOff size={12} />
            </StatusIcon>
          ) : null}
          {cameraOn ? (
            <StatusIcon label={VOICE_CAMERA_ON_LABEL}>
              <Video size={12} />
            </StatusIcon>
          ) : null}
          {screenSharing ? (
            <StatusIcon label={VOICE_SCREEN_SHARING}>
              <MonitorUp size={12} />
            </StatusIcon>
          ) : null}
        </div>
      </div>
      {isLocal ? null : (
        <button
          type="button"
          onClick={onToggleMutedForMe}
          aria-label={`${muteForMeLabel}: ${name}`}
          aria-pressed={mutedForMe}
          title={muteForMeLabel}
          className={cn(
            "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors",
            mutedForMe
              ? "bg-danger/20 text-danger hover:bg-danger/30"
              : "bg-surface-input text-content-muted hover:text-content",
          )}
        >
          <VolumeX size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={onTogglePin}
        aria-label={voicePinLabel(name, isPinned)}
        aria-pressed={isPinned}
        className={cn(
          "shrink-0 cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
          isPinned
            ? "bg-accent text-on-accent"
            : "bg-surface-input text-content-muted hover:text-content",
        )}
      >
        {isPinned ? VOICE_UNPIN : VOICE_PIN}
      </button>
    </li>
  );
}

function StatusIcon({
  label,
  danger = false,
  children,
}: {
  label: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("flex", danger ? "text-danger" : "text-content-muted")}
    >
      {children}
    </span>
  );
}
