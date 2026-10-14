"use client";

import {
  VOICE_AUDIO_BLOCKED,
  VOICE_CHANNEL_EMPTY,
  VOICE_CONNECT_FORBIDDEN,
  VOICE_IN_CHANNEL_LABEL,
  VOICE_JOIN,
  VOICE_MODERATOR_MUTED,
  VOICE_SWITCH,
  voiceParticipantsOf,
  voicePresenceCount,
  type Channel,
  type User,
  type VoicePresenceParticipant,
} from "@discordia/client-shared";

import { TriangleAlert, Volume2, VolumeX, X } from "lucide-react";
import type { ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { useVoiceSession } from "@/services/voice/VoiceSessionContext";

import { VoiceControls } from "./VoiceControls";
import { VoiceParticipantGrid } from "./VoiceParticipantGrid";
import { ownAvatarSrc } from "./ownAvatar";

interface VoiceChannelViewProps {
  channel: Channel;
  serverId: string;
  serverName: string;
  canConnect: boolean;
  /** Los permisos del canal todavia no llegaron: ni boton ni "no tenes permiso". */
  isCheckingAccess?: boolean;
  ownProfile: User | null;
  /** Quien esta en este canal, para la pantalla previa a entrar. */
  presence: readonly VoicePresenceParticipant[];
}

export function VoiceChannelView({
  channel,
  serverId,
  serverName,
  canConnect,
  isCheckingAccess = false,
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
        isCheckingAccess={isCheckingAccess}
        isInAnotherChannel={state.target !== null}
        presence={presence}
        notice={state.notice}
        onDismissNotice={voice.dismissNotice}
        onJoin={() =>
          voice.join({
            serverId,
            serverName,
            channelId: channel.id,
            channelName: channel.name,
          })
        }
      />
    );
  }

  const participants = voiceParticipantsOf(state);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <VoiceParticipantGrid
        participants={participants}
        isConnecting={state.status === "connecting"}
        ownAvatarSrc={ownAvatarSrc(ownProfile)}
        videoOf={voice.videoOf}
        onToggleMutedForMe={voice.toggleMutedForMe}
      />

      {voice.isAudioBlocked ? (
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
      {!state.canSpeak ? (
        <CallBanner>{VOICE_MODERATOR_MUTED}</CallBanner>
      ) : voice.mediaError ? (
        <CallBanner>{voice.mediaError}</CallBanner>
      ) : null}

      <VoiceControls
        muted={state.muted}
        canSpeak={state.canSpeak}
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

function CallBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 justify-center px-4 pb-2">
      <p className="bg-highlight/15 text-content flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
        <TriangleAlert size={15} className="text-highlight shrink-0" />
        {children}
      </p>
    </div>
  );
}

function VoiceLobby({
  channelName,
  canConnect,
  isCheckingAccess,
  isInAnotherChannel,
  presence,
  notice,
  onDismissNotice,
  onJoin,
}: {
  channelName: string;
  canConnect: boolean;
  isCheckingAccess: boolean;
  isInAnotherChannel: boolean;
  presence: readonly VoicePresenceParticipant[];
  notice: string | null;
  onDismissNotice: () => void;
  onJoin: () => void;
}) {
  const isForbidden = !canConnect && !isCheckingAccess;
  const Icon = isForbidden ? VolumeX : Volume2;
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
          {isForbidden
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

      {notice ? (
        <p
          role="alert"
          className="bg-danger/10 text-danger flex max-w-sm items-start gap-2 rounded-lg px-3 py-2 text-left text-sm"
        >
          <span className="flex-1">{notice}</span>
          <button
            type="button"
            onClick={onDismissNotice}
            aria-label="Cerrar aviso"
            className="cursor-pointer opacity-70 hover:opacity-100"
          >
            <X size={15} />
          </button>
        </p>
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
