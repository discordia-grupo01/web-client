"use client";

import {
  VOICE_CAMERA_ON_LABEL,
  VOICE_MUTED_LABEL,
  VOICE_SCREEN_SHARING,
  VOICE_SHOW_LESS,
  VOICE_SIDEBAR_PREVIEW_SIZE,
  voiceHiddenCount,
  voiceSidebarPreview,
} from "@discordia/client-shared";

import { MicOff, MonitorUp, Video } from "lucide-react";

import { useState, type ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

export interface SidebarVoiceParticipant {
  identity: string;
  name: string;
  avatarSrc?: string | null;
  muted?: boolean;
  speaking?: boolean;
  cameraOn?: boolean;
  screenSharing?: boolean;
}

export function VoiceChannelParticipants({
  participants,
}: {
  participants: readonly SidebarVoiceParticipant[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (participants.length === 0) return null;

  const { shown, hidden } = voiceSidebarPreview(
    participants,
    VOICE_SIDEBAR_PREVIEW_SIZE,
  );
  const listed = isExpanded ? participants : shown;

  return (
    <ul className="mb-1 ml-4">
      {listed.map((participant) => (
        <li
          key={participant.identity}
          className="hover:bg-surface-hover flex items-center gap-2 rounded-md px-2 py-1 transition-colors"
        >
          <span className="relative shrink-0">
            <Avatar
              name={participant.name}
              src={participant.avatarSrc}
              size={20}
              className="rounded-full"
            />
            <span
              aria-hidden
              className={cn(
                "absolute -inset-0.5 rounded-full border-[1.5px] border-transparent transition-colors",
                participant.speaking && "border-success",
              )}
            />
          </span>
          <span
            className={cn(
              "font-display min-w-0 flex-1 truncate text-xs",
              participant.speaking ? "text-content" : "text-content-muted",
            )}
          >
            {participant.name}
          </span>
          {participant.screenSharing ? (
            <StatusIcon
              label={VOICE_SCREEN_SHARING}
              className="text-content-muted"
            >
              <MonitorUp size={12} />
            </StatusIcon>
          ) : null}
          {participant.cameraOn ? (
            <StatusIcon
              label={VOICE_CAMERA_ON_LABEL}
              className="text-content-muted"
            >
              <Video size={12} />
            </StatusIcon>
          ) : null}
          {participant.muted ? (
            <StatusIcon label={VOICE_MUTED_LABEL} className="text-danger">
              <MicOff size={11} />
            </StatusIcon>
          ) : null}
        </li>
      ))}
      {hidden.length > 0 ? (
        <li>
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-expanded={isExpanded}
            className="font-display text-content-subtle hover:bg-surface-hover hover:text-content-muted w-full cursor-pointer rounded-md px-2 py-1 text-left text-xs transition-colors"
          >
            {isExpanded ? VOICE_SHOW_LESS : voiceHiddenCount(hidden.length)}
          </button>
        </li>
      ) : null}
    </ul>
  );
}

function StatusIcon({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("flex shrink-0", className)}
    >
      {children}
    </span>
  );
}
