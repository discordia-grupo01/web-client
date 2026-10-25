"use client";

import {
  VOICE_CONNECTED,
  VOICE_CONNECTING,
  VOICE_LEAVE_LABEL,
  VOICE_RECONNECTING,
  voiceConnectedLocation,
} from "@discordia/client-shared";

import { PhoneOff, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { useOptionalVoiceSession } from "@/contexts/VoiceSessionContext";

const STATUS_LABEL = {
  connecting: VOICE_CONNECTING,
  reconnecting: VOICE_RECONNECTING,
  connected: VOICE_CONNECTED,
} as const;

export function VoiceConnectedStrip() {
  const voice = useOptionalVoiceSession();
  const target = voice?.state.target;
  if (!voice) return null;
  if (!target || voice.state.status === "idle") {
    return voice.state.notice ? (
      <VoiceEndedNotice
        message={voice.state.notice}
        onDismiss={voice.dismissNotice}
      />
    ) : null;
  }

  const isConnected = voice.state.status === "connected";

  return (
    <div
      className="flex shrink-0 items-center gap-1 px-2 py-1.5"
      style={{
        background: "color-mix(in srgb, var(--success) 10%, transparent)",
        borderTop:
          "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
      }}
    >
      <button
        type="button"
        onClick={voice.focusConnectedChannel}
        className="hover:bg-success/10 min-w-0 flex-1 cursor-pointer rounded-md px-1 py-0.5 text-left transition-colors"
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full",
              isConnected ? "bg-success animate-pulse" : "bg-highlight",
            )}
          />
          <span
            className={cn(
              "font-display text-xs font-semibold",
              isConnected ? "text-success" : "text-highlight",
            )}
          >
            {STATUS_LABEL[voice.state.status]}
          </span>
        </span>
        <span className="text-content-subtle mt-0.5 block truncate text-[10px]">
          {voiceConnectedLocation(target.channelName, target.serverName)}
        </span>
      </button>
      <button
        type="button"
        onClick={voice.leave}
        aria-label={VOICE_LEAVE_LABEL}
        title={VOICE_LEAVE_LABEL}
        className="text-content-muted hover:bg-danger/10 hover:text-danger flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
      >
        <PhoneOff size={15} />
      </button>
    </div>
  );
}

/** Por que se corto la llamada (te sacaron, se cerro el canal, se cayo). */
function VoiceEndedNotice({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="bg-danger/10 border-danger/20 text-danger flex shrink-0 items-start gap-2 border-t px-3 py-2 text-xs"
    >
      <TriangleAlert size={14} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="cursor-pointer opacity-70 hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}
