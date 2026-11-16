"use client";

import {
  isMicMediaError,
  VOICE_CAMERA_ERROR_TITLE,
  VOICE_MEDIA_ERROR_DISMISS,
  VOICE_MIC_ERROR_TITLE,
  type VoiceMediaError,
  voiceMediaErrorMessage,
} from "@discordia/client-shared";

import { MicOff, VideoOff } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

interface VoiceMediaErrorDialogProps {
  error: VoiceMediaError;
  onClose: () => void;
}

/** Por que no se prendio el microfono o la camara, en vez de que el boton se apague solo. */
export function VoiceMediaErrorDialog({
  error,
  onClose,
}: VoiceMediaErrorDialogProps) {
  const titleId = useId();
  const isMic = isMicMediaError(error);
  const Icon = isMic ? MicOff : VideoOff;

  return (
    <ModalShell onClose={onClose} maxWidth={420} labelledBy={titleId}>
      <div className="flex flex-col items-center gap-5 px-7 py-8 text-center">
        <div className="bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl">
          <Icon size={28} />
        </div>
        <div>
          <h2
            id={titleId}
            className="font-display text-content mb-2 text-xl font-bold"
          >
            {isMic ? VOICE_MIC_ERROR_TITLE : VOICE_CAMERA_ERROR_TITLE}
          </h2>
          <p className="text-content-muted text-sm leading-relaxed">
            {voiceMediaErrorMessage(error)}
          </p>
        </div>
        <Button type="button" onClick={onClose} autoFocus>
          {VOICE_MEDIA_ERROR_DISMISS}
        </Button>
      </div>
    </ModalShell>
  );
}
