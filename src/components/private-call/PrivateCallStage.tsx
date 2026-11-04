"use client";

import {
  type MessageAuthor,
  type PrivateCallPartner,
  voiceParticipantsOf,
} from "@discordia/client-shared";

import { useMemo } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { VoiceParticipantGrid } from "@/components/voice/VoiceParticipantGrid";
import { useVoiceSession } from "@/contexts/VoiceSessionContext";
import { cn } from "@/lib/cn";

const NO_PANEL = () => undefined;

interface PrivateCallStageProps {
  me: MessageAuthor;
  partner: PrivateCallPartner;
  isRinging: boolean;
}

export function PrivateCallStage({
  me,
  partner,
  isRinging,
}: PrivateCallStageProps) {
  const voice = useVoiceSession();
  const participants = useMemo(
    () =>
      voiceParticipantsOf(voice.state).map((participant) => ({
        ...participant,
        name: participant.isLocal ? me.name : partner.name,
      })),
    [voice.state, me.name, partner.name],
  );
  const hasVideo =
    !isRinging &&
    participants.some(
      (participant) => participant.cameraOn || participant.screenSharing,
    );

  if (hasVideo) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col p-2 sm:p-4">
        <VoiceParticipantGrid
          participants={participants}
          isConnecting={voice.state.status === "connecting"}
          ownAvatarSrc={me.avatarUrl}
          videoOf={voice.videoOf}
          onToggleMutedForMe={voice.toggleMutedForMe}
          onShowParticipants={NO_PANEL}
          pinnedIdentity={null}
        />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 items-center justify-center p-5 sm:p-10">
      <div
        aria-hidden
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--accent) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative flex flex-col items-center text-center">
        <Avatar
          name={partner.name}
          src={partner.avatarUrl}
          size={128}
          className={cn(
            "ring-success/20 rounded-full ring-8",
            isRinging && "animate-pulse",
          )}
        />
        <h2 className="font-display text-content mt-5 text-xl font-bold">
          {partner.name}
        </h2>
      </div>
    </div>
  );
}
