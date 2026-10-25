import type {
  VoiceDisconnectReason,
  VoiceParticipant,
} from "@discordia/client-shared";

import {
  DisconnectReason,
  type Participant,
  RoomEvent,
  Track,
} from "livekit-client";

/** Eventos de LiveKit que cambian lo que se ve de los participantes. */
export const PARTICIPANT_EVENTS = [
  RoomEvent.ParticipantConnected,
  RoomEvent.ParticipantDisconnected,
  RoomEvent.ParticipantNameChanged,
  RoomEvent.TrackPublished,
  RoomEvent.TrackUnpublished,
  RoomEvent.TrackMuted,
  RoomEvent.TrackUnmuted,
  RoomEvent.LocalTrackPublished,
  RoomEvent.LocalTrackUnpublished,
  RoomEvent.ActiveSpeakersChanged,
] as const;

type ParticipantState = Pick<
  Participant,
  | "identity"
  | "name"
  | "isMicrophoneEnabled"
  | "isSpeaking"
  | "isCameraEnabled"
  | "isScreenShareEnabled"
>;

/**
 * Un participante de LiveKit como lo usa la UI. El "silenciar para mi" no
 * sale de LiveKit: lo aplica `voiceParticipantsOf` con el estado de la sesion.
 */
export function toVoiceParticipant(
  participant: ParticipantState,
  isLocal: boolean,
): VoiceParticipant {
  return {
    identity: participant.identity,
    name: participant.name || participant.identity,
    isLocal,
    muted: !participant.isMicrophoneEnabled,
    speaking: participant.isSpeaking,
    cameraOn: participant.isCameraEnabled,
    screenSharing: participant.isScreenShareEnabled,
    mutedForMe: false,
  };
}

/** Todos los de la sala, vos incluido. */
export function roomParticipants(room: {
  localParticipant: ParticipantState;
  remoteParticipants: ReadonlyMap<string, ParticipantState>;
}): VoiceParticipant[] {
  return [
    toVoiceParticipant(room.localParticipant, true),
    ...Array.from(room.remoteParticipants.values(), (participant) =>
      toVoiceParticipant(participant, false),
    ),
  ];
}

/** El video de una tarjeta. La pantalla compartida le gana a la camara. */
export interface TileVideo<T = Track> {
  track: T;
  source: "camera" | "screen";
}

/** Lo que hace falta de un participante de LiveKit para encontrar su video. */
interface VideoParticipant<T> {
  identity: string;
  getTrackPublication: (
    source: Track.Source,
  ) => { isMuted: boolean; track?: T } | undefined;
}

interface VideoRoom<T> {
  localParticipant: VideoParticipant<T>;
  remoteParticipants: ReadonlyMap<string, VideoParticipant<T>>;
}

function publishedVideo<T>(
  participant: VideoParticipant<T> | undefined,
  source: Track.Source,
): T | null {
  const publication = participant?.getTrackPublication(source);
  return publication && !publication.isMuted
    ? (publication.track ?? null)
    : null;
}

export function tileVideoOf<T>(
  room: VideoRoom<T>,
  identity: string,
): TileVideo<T> | null {
  const participant =
    room.localParticipant.identity === identity
      ? room.localParticipant
      : room.remoteParticipants.get(identity);
  const screen = publishedVideo(participant, Track.Source.ScreenShare);
  if (screen) return { track: screen, source: "screen" };
  const camera = publishedVideo(participant, Track.Source.Camera);
  return camera ? { track: camera, source: "camera" } : null;
}

/**
 * Por que se corto, en los terminos de la app. `removed` cubre que te saque
 * signaling (kick, ban, perder el acceso) y que entres desde otro dispositivo.
 */
export function toVoiceDisconnectReason(
  reason: DisconnectReason | undefined,
): VoiceDisconnectReason {
  switch (reason) {
    case DisconnectReason.CLIENT_INITIATED:
      return "client";
    case DisconnectReason.PARTICIPANT_REMOVED:
    case DisconnectReason.DUPLICATE_IDENTITY:
      return "removed";
    case DisconnectReason.ROOM_DELETED:
    case DisconnectReason.ROOM_CLOSED:
      return "room_closed";
    default:
      return "error";
  }
}
