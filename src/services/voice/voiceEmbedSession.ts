import {
  type VoiceBridgeCommand,
  type VoiceBridgeEvent,
  VOICE_BRIDGE_PARTICIPANTS_THROTTLE_MS,
} from "@discordia/client-shared";

import {
  ConnectionState,
  type DisconnectReason,
  type LocalTrackPublication,
  type Participant,
  type RemoteTrack,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";

import {
  PARTICIPANT_EVENTS,
  roomParticipants,
  type TileVideo,
  tileVideoOf,
  toVoiceDisconnectReason,
} from "./livekitParticipants";

/** Lo que la sesion atiende; el tema, la foto y a quien se fija los aplica la pagina. */
export type VoiceEmbedCommand = Exclude<
  VoiceBridgeCommand,
  { type: "setAppearance" } | { type: "setPinned" }
>;

export interface VoiceEmbedSession {
  handle: (command: VoiceEmbedCommand) => void;
  videoOf: (identity: string) => TileVideo | null;
  dispose: () => void;
}

/**
 * La llamada que corre dentro del WebView de mobile. La app manda comandos y
 * esta sesion le contesta con eventos; no sabe nada de canales ni de signaling,
 * eso lo resuelve la app antes de mandar `connect`.
 */
export function createVoiceEmbedSession(
  post: (event: VoiceBridgeEvent) => void,
  audioHost: HTMLElement,
): VoiceEmbedSession {
  let room: Room | null = null;
  // La app puede mandar el mic y la camara antes de que termine de conectar.
  let microphoneEnabled = false;
  let cameraEnabled = false;
  const mutedForMe = new Set<string>();
  let participantsTimer: ReturnType<typeof setTimeout> | null = null;
  let participantsPending = false;

  const postParticipants = (current: Room) => {
    post({
      type: "participants",
      participants: roomParticipants(current).map((participant) => ({
        ...participant,
        mutedForMe: mutedForMe.has(participant.identity),
      })),
    });
  };

  // Hablar dispara muchos eventos por segundo y cada uno cruza el puente.
  const syncParticipants = (current: Room) => {
    if (participantsTimer) {
      participantsPending = true;
      return;
    }
    postParticipants(current);
    participantsTimer = setTimeout(() => {
      participantsTimer = null;
      if (participantsPending && room === current) {
        participantsPending = false;
        syncParticipants(current);
      }
    }, VOICE_BRIDGE_PARTICIPANTS_THROTTLE_MS);
  };

  const canPublish = (current: Room) =>
    current.localParticipant.permissions?.canPublish !== false;

  const applyMicrophone = async (current: Room) => {
    const enabled = microphoneEnabled && canPublish(current);
    try {
      await current.localParticipant.setMicrophoneEnabled(enabled);
    } catch {
      if (enabled) post({ type: "error", error: "mic_denied" });
    }
  };

  const stopCamera = () => {
    cameraEnabled = false;
    post({ type: "cameraStopped" });
  };

  const applyCamera = async (current: Room) => {
    const enabled = cameraEnabled;
    try {
      await current.localParticipant.setCameraEnabled(enabled);
    } catch {
      if (!enabled || !cameraEnabled) return;
      post({ type: "error", error: "camera_denied" });
      stopCamera();
    }
  };

  const applyVolumes = (current: Room) => {
    current.remoteParticipants.forEach((participant) => {
      participant.setVolume(mutedForMe.has(participant.identity) ? 0 : 1);
    });
  };

  const teardown = (current: Room) => {
    current.removeAllListeners();
    current.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        publication.track?.detach().forEach((element) => element.remove());
      });
    });
    if (participantsTimer) clearTimeout(participantsTimer);
    participantsTimer = null;
    participantsPending = false;
    if (room === current) room = null;
  };

  const listen = (current: Room) => {
    const sync = () => syncParticipants(current);
    PARTICIPANT_EVENTS.forEach((event) => current.on(event, sync));

    current.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Audio) {
        audioHost.append(track.attach());
        applyVolumes(current);
      }
      sync();
    });
    current.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      track.detach().forEach((element) => element.remove());
      sync();
    });
    current.on(RoomEvent.ConnectionStateChanged, (connection) => {
      if (connection === ConnectionState.Connected) {
        post({ type: "status", status: "connected" });
      } else if (
        connection === ConnectionState.Reconnecting ||
        connection === ConnectionState.SignalReconnecting
      ) {
        post({ type: "status", status: "reconnecting" });
      }
    });
    current.on(
      RoomEvent.ParticipantPermissionsChanged,
      (_previous, participant: Participant) => {
        if (participant !== current.localParticipant) return;
        post({ type: "speakPermission", allowed: canPublish(current) });
        void applyMicrophone(current);
      },
    );
    // Si se pierde la camara, LiveKit despublica el track sin que la app lo
    // pida: el boton de la app tiene que volver a "apagada".
    current.on(
      RoomEvent.LocalTrackUnpublished,
      (publication: LocalTrackPublication) => {
        if (
          publication.source === Track.Source.Camera &&
          cameraEnabled &&
          !current.localParticipant.isCameraEnabled
        ) {
          stopCamera();
        }
      },
    );
    current.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      if (!current.canPlaybackAudio) {
        post({ type: "error", error: "audio_blocked" });
      }
    });
  };

  // Se escucha recien conectados: si `connect()` falla, LiveKit tambien
  // dispara `Disconnected` y eso no es un corte sino un `connect_failed`.
  const listenForDisconnect = (current: Room) => {
    current.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
      if (room !== current) return;
      teardown(current);
      post({ type: "disconnected", reason: toVoiceDisconnectReason(reason) });
    });
  };

  const connect = async (url: string, token: string) => {
    const previous = room;
    if (previous) {
      teardown(previous);
      void previous.disconnect();
    }

    const current = new Room({ adaptiveStream: true, dynacast: true });
    room = current;
    listen(current);
    post({ type: "status", status: "connecting" });
    try {
      await current.connect(url, token);
    } catch {
      if (room !== current) return;
      teardown(current);
      post({ type: "error", error: "connect_failed" });
      return;
    }
    if (room !== current) return;
    listenForDisconnect(current);

    post({ type: "status", status: "connected" });
    post({ type: "speakPermission", allowed: canPublish(current) });
    syncParticipants(current);
    if (!current.canPlaybackAudio) {
      post({ type: "error", error: "audio_blocked" });
    }
    await applyMicrophone(current);
    if (cameraEnabled) await applyCamera(current);
  };

  const disconnect = () => {
    const current = room;
    if (!current) return;
    // `disconnect()` dispara `Disconnected` con CLIENT_INITIATED y eso avisa.
    void current.disconnect();
  };

  return {
    handle(command) {
      switch (command.type) {
        case "connect":
          void connect(command.url, command.token);
          return;
        case "setMicrophoneEnabled":
          microphoneEnabled = command.enabled;
          if (room?.state === ConnectionState.Connected) {
            void applyMicrophone(room);
          }
          return;
        case "setCameraEnabled":
          cameraEnabled = command.enabled;
          if (room?.state === ConnectionState.Connected) {
            void applyCamera(room);
          }
          return;
        case "setMutedForMe":
          if (command.muted) mutedForMe.add(command.identity);
          else mutedForMe.delete(command.identity);
          if (room) {
            applyVolumes(room);
            postParticipants(room);
          }
          return;
        case "disconnect":
          disconnect();
          return;
      }
    },
    videoOf(identity) {
      return room ? tileVideoOf<Track>(room, identity) : null;
    },
    dispose() {
      const current = room;
      if (!current) return;
      teardown(current);
      void current.disconnect();
    },
  };
}
