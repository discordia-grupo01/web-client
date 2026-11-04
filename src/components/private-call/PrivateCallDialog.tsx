"use client";

import {
  type MessageAuthor,
  PRIVATE_CALL_CONNECTED,
  PRIVATE_CALL_HANG_UP,
  PRIVATE_CALL_INCOMING,
  PRIVATE_CALL_MINIMIZE,
  PRIVATE_CALL_OUTGOING,
  type PrivateCallPhase,
  privateCallDialogLabel,
  privateCallTitle,
  VOICE_AUDIO_BLOCKED,
  VOICE_CONNECTING,
} from "@discordia/client-shared";

import { Minimize2 } from "lucide-react";

import { CallBanner } from "@/components/voice/CallBanner";
import { VoiceControls } from "@/components/voice/VoiceControls";
import { useOptionalPrivateCall } from "@/contexts/PrivateCallContext";
import { useVoiceSession } from "@/contexts/VoiceSessionContext";
import { cn } from "@/lib/cn";

import { useIncomingCallAlert } from "./hooks/useIncomingCallAlert";
import { PrivateCallRingingActions } from "./PrivateCallRingingActions";
import { PrivateCallStage } from "./PrivateCallStage";

const SUBTITLE: Record<Exclude<PrivateCallPhase, "idle">, string> = {
  outgoing: PRIVATE_CALL_OUTGOING,
  incoming: PRIVATE_CALL_INCOMING,
  connecting: VOICE_CONNECTING,
  in_call: PRIVATE_CALL_CONNECTED,
};

export function PrivateCallDialog({ me }: { me: MessageAuthor }) {
  const privateCall = useOptionalPrivateCall();
  const voice = useVoiceSession();
  const phase = privateCall?.state.phase ?? "idle";
  useIncomingCallAlert(phase === "incoming", PRIVATE_CALL_INCOMING);

  if (!privateCall || phase === "idle" || privateCall.isMinimized) return null;
  const { partner } = privateCall.state;
  if (!partner) return null;

  const isInRoom = phase === "connecting" || phase === "in_call";
  const { state } = voice;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={privateCallDialogLabel(partner.name)}
        className="bg-surface border-line-strong relative flex h-full w-full flex-col overflow-hidden sm:h-200 sm:max-h-full sm:max-w-5xl sm:rounded-2xl sm:border sm:shadow-2xl"
      >
        <header className="border-line flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-display text-content truncate text-sm font-semibold">
              {privateCallTitle(partner.name)}
            </p>
            <p
              className={cn(
                "text-xs",
                phase === "in_call" ? "text-success" : "text-content-subtle",
              )}
            >
              {SUBTITLE[phase]}
            </p>
          </div>
          {isInRoom ? (
            <button
              type="button"
              onClick={privateCall.minimize}
              aria-label={PRIVATE_CALL_MINIMIZE}
              title={PRIVATE_CALL_MINIMIZE}
              className="bg-surface-input text-content-muted hover:bg-surface-hover cursor-pointer rounded-lg p-2 transition-colors"
            >
              <Minimize2 size={17} />
            </button>
          ) : null}
        </header>

        <PrivateCallStage me={me} partner={partner} isRinging={!isInRoom} />

        {isInRoom && voice.isAudioBlocked ? (
          <CallBanner>
            <button
              type="button"
              onClick={voice.startAudio}
              className="cursor-pointer underline-offset-2 hover:underline"
            >
              {VOICE_AUDIO_BLOCKED}
            </button>
          </CallBanner>
        ) : null}
        {isInRoom && voice.mediaError ? (
          <CallBanner>{voice.mediaError}</CallBanner>
        ) : null}

        <footer className="bg-surface-sunken border-line shrink-0 border-t pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {isInRoom ? (
            <VoiceControls
              muted={state.muted}
              canSpeak={state.canSpeak}
              cameraOn={state.cameraOn}
              screenSharing={state.screenSharing}
              onToggleMute={voice.toggleMute}
              onToggleCamera={voice.toggleCamera}
              onToggleScreenShare={voice.toggleScreenShare}
              onLeave={privateCall.hangUp}
              leaveLabel={PRIVATE_CALL_HANG_UP}
              leaveAriaLabel={PRIVATE_CALL_HANG_UP}
            />
          ) : (
            <PrivateCallRingingActions
              phase={phase}
              onAccept={privateCall.accept}
              onDecline={privateCall.decline}
              onCancel={privateCall.cancel}
            />
          )}
        </footer>
      </div>
    </div>
  );
}
