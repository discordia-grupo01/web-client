"use client";

import {
  VOICE_CAMERA,
  VOICE_CAMERA_OFF,
  VOICE_CAMERA_OFF_ACTION,
  VOICE_CAMERA_ON_ACTION,
  VOICE_CONTROLS_LABEL,
  VOICE_LEAVE,
  VOICE_LEAVE_LABEL,
  VOICE_MUTE,
  VOICE_MUTE_LABEL,
  VOICE_SCREEN_SHARE,
  VOICE_SCREEN_SHARE_START,
  VOICE_SCREEN_SHARE_STOP,
  VOICE_SCREEN_SHARING,
  VOICE_UNMUTE,
  VOICE_UNMUTE_LABEL,
} from "@discordia/client-shared";

import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Video,
  VideoOff,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

type ControlTone = "neutral" | "danger" | "accent";

interface VoiceControlsProps {
  muted: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export function VoiceControls({
  muted,
  cameraOn,
  screenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}: VoiceControlsProps) {
  return (
    <div className="flex shrink-0 justify-center px-4 pb-6">
      <div
        role="toolbar"
        aria-label={VOICE_CONTROLS_LABEL}
        className="bg-surface-raised border-line-strong flex items-center gap-1 rounded-2xl border px-2 py-2.5 backdrop-blur-xl md:gap-2 md:px-4"
        style={{ boxShadow: "0 16px 48px rgba(0, 0, 0, 0.3)" }}
      >
        <ControlButton
          icon={muted ? MicOff : Mic}
          label={muted ? VOICE_UNMUTE : VOICE_MUTE}
          ariaLabel={muted ? VOICE_UNMUTE_LABEL : VOICE_MUTE_LABEL}
          tone={muted ? "danger" : "neutral"}
          isPressed={muted}
          onClick={onToggleMute}
        />
        <ControlButton
          icon={cameraOn ? Video : VideoOff}
          label={cameraOn ? VOICE_CAMERA : VOICE_CAMERA_OFF}
          ariaLabel={
            cameraOn ? VOICE_CAMERA_OFF_ACTION : VOICE_CAMERA_ON_ACTION
          }
          tone={cameraOn ? "neutral" : "danger"}
          isPressed={cameraOn}
          onClick={onToggleCamera}
        />
        <ControlButton
          icon={MonitorUp}
          label={screenSharing ? VOICE_SCREEN_SHARING : VOICE_SCREEN_SHARE}
          ariaLabel={
            screenSharing ? VOICE_SCREEN_SHARE_STOP : VOICE_SCREEN_SHARE_START
          }
          tone={screenSharing ? "accent" : "neutral"}
          isPressed={screenSharing}
          onClick={onToggleScreenShare}
        />

        <span aria-hidden className="bg-line mx-1 h-10 w-px" />

        <ControlButton
          icon={PhoneOff}
          label={VOICE_LEAVE}
          ariaLabel={VOICE_LEAVE_LABEL}
          tone="danger"
          isLeave
          onClick={onLeave}
        />
      </div>
    </div>
  );
}

const TONE_CLASSES: Record<ControlTone, { button: string; icon: string }> = {
  neutral: {
    button: "bg-surface-input hover:bg-surface-hover",
    icon: "text-content-muted",
  },
  danger: { button: "bg-danger/12 hover:bg-danger/20", icon: "text-danger" },
  accent: { button: "bg-accent/18 hover:bg-accent/25", icon: "text-accent" },
};

function ControlButton({
  icon: Icon,
  label,
  ariaLabel,
  tone,
  isPressed,
  isLeave = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  ariaLabel: string;
  tone: ControlTone;
  isPressed?: boolean;
  isLeave?: boolean;
  onClick: () => void;
}) {
  const classes = TONE_CLASSES[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isPressed}
      title={ariaLabel}
      className={cn(
        "flex min-w-14 cursor-pointer flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all active:scale-95 md:px-4",
        "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
        classes.button,
        isLeave &&
          "bg-danger/15 hover:bg-danger/25 border-danger/30 border md:px-5",
      )}
    >
      <Icon size={20} className={classes.icon} />
      <span
        className={cn(
          "text-[10px]",
          isLeave ? "font-semibold" : "font-medium",
          tone === "neutral" ? "text-content-subtle" : classes.icon,
        )}
      >
        {label}
      </span>
    </button>
  );
}
