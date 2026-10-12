"use client";

import {
  VOICE_CHANNEL_EMPTY,
  VOICE_CONNECT_FORBIDDEN,
  VOICE_IN_CHANNEL_LABEL,
  VOICE_JOIN,
  VOICE_SWITCH,
  voicePresenceCount,
  type Channel,
  type User,
  type VoicePresenceParticipant,
} from "@discordia/client-shared";

import { Volume2, VolumeX } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { useVoiceSession } from "@/services/voice/VoiceSessionContext";
import { voiceParticipantsOf } from "@/services/voice/voiceSession";

import { VoiceControls } from "./VoiceControls";
import { VoiceParticipantTile } from "./VoiceParticipantTile";
import { ownAvatarSrc } from "./ownAvatar";

interface VoiceChannelViewProps {
  channel: Channel;
  serverId: string;
  serverName: string;
  /** Todos los canales del servidor (los datos de prueba salen de aca). */
  channels: readonly Channel[];
  canConnect: boolean;
  ownProfile: User | null;
  /** Quien esta en este canal, para la pantalla previa a entrar. */
  presence: readonly VoicePresenceParticipant[];
}

export function VoiceChannelView({
  channel,
  serverId,
  serverName,
  channels,
  canConnect,
  ownProfile,
  presence,
}: VoiceChannelViewProps) {
  const voice = useVoiceSession();
  const { state } = voice;
  const isInThisChannel = state.target?.channelId === channel.id;

  if (!isInThisChannel || !ownProfile) {
    return (
      <VoiceLobby
        channelName={channel.name}
        canConnect={canConnect && ownProfile !== null}
        isInAnotherChannel={state.target !== null}
        presence={presence}
        onJoin={() =>
          voice.join(
            {
              serverId,
              serverName,
              channelId: channel.id,
              channelName: channel.name,
            },
            channels,
          )
        }
      />
    );
  }

  const participants = voiceParticipantsOf(state, {
    identity: ownProfile.id,
    name: ownProfile.name,
  });
  const ownSrc = ownAvatarSrc(ownProfile);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 overflow-y-auto p-3 md:p-8">
        <div
          className={cn(
            "m-auto grid w-full gap-4",
            participants.length === 1
              ? "max-w-2xl grid-cols-1"
              : "max-w-4xl grid-cols-1 sm:grid-cols-2",
            participants.length > 4 && "max-w-6xl xl:grid-cols-3",
            state.status === "connecting" && "opacity-60",
          )}
        >
          {participants.map((participant) => (
            <VoiceParticipantTile
              key={participant.identity}
              participant={participant}
              avatarSrc={participant.isLocal ? ownSrc : null}
              onToggleMutedForMe={
                participant.isLocal
                  ? undefined
                  : () => voice.toggleMutedForMe(participant.identity)
              }
            />
          ))}
        </div>
      </div>

      <VoiceControls
        muted={state.muted}
        cameraOn={state.cameraOn}
        screenSharing={state.screenSharing}
        onToggleMute={voice.toggleMute}
        onToggleCamera={voice.toggleCamera}
        onToggleScreenShare={voice.toggleScreenShare}
        onLeave={voice.leave}
      />
    </div>
  );
}

function VoiceLobby({
  channelName,
  canConnect,
  isInAnotherChannel,
  presence,
  onJoin,
}: {
  channelName: string;
  canConnect: boolean;
  isInAnotherChannel: boolean;
  presence: readonly VoicePresenceParticipant[];
  onJoin: () => void;
}) {
  const Icon = canConnect ? Volume2 : VolumeX;
  const shown = presence.slice(0, 5);
  const hidden = presence.length - shown.length;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="from-accent-gradient-start to-accent-gradient-end flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg">
        <Icon size={28} className="text-on-accent" />
      </div>

      <div>
        <h2 className="font-display text-content text-xl font-bold">
          {channelName}
        </h2>
        <p className="text-content-muted mt-1 max-w-sm text-sm leading-relaxed">
          {!canConnect
            ? VOICE_CONNECT_FORBIDDEN
            : presence.length === 0
              ? VOICE_CHANNEL_EMPTY
              : voicePresenceCount(presence.length)}
        </p>
      </div>

      {presence.length > 0 ? (
        <ul className="flex items-center" aria-label={VOICE_IN_CHANNEL_LABEL}>
          {shown.map((participant) => (
            <li
              key={participant.participant_id}
              title={participant.name}
              className="-ml-2 first:ml-0"
            >
              <Avatar
                name={participant.name}
                size={36}
                className="border-surface rounded-full border-2"
              />
            </li>
          ))}
          {hidden > 0 ? (
            <li className="bg-surface-raised border-surface text-content-muted -ml-2 flex size-9 items-center justify-center rounded-full border-2 text-xs font-semibold">
              +{hidden}
            </li>
          ) : null}
        </ul>
      ) : null}

      {canConnect ? (
        <button
          type="button"
          onClick={onJoin}
          className="bg-success flex cursor-pointer items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Volume2 size={16} />
          {isInAnotherChannel ? VOICE_SWITCH : VOICE_JOIN}
        </button>
      ) : null}
    </div>
  );
}
