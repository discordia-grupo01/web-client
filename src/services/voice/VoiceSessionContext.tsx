"use client";

import {
  initialVoiceSessionState,
  VOICE_CONNECT_FAILED,
  VOICE_MIC_DENIED,
  voiceDisconnectMessage,
  voiceSessionReducer,
  type VoiceSessionState,
  type VoiceSessionTarget,
} from "@discordia/client-shared";

import {
  ConnectionState,
  type DisconnectReason,
  type Participant,
  type RemoteTrack,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { leaveVoiceSessionRequest, requestVoiceTokenRequest } from "./client";
import {
  PARTICIPANT_EVENTS,
  roomParticipants,
  toVoiceDisconnectReason,
} from "./livekitParticipants";

export type VoiceVideoSource = "camera" | "screen";

interface VoiceSessionValue {
  state: VoiceSessionState;
  /** Falla de medios dentro de la llamada (mic denegado); la llamada sigue. */
  mediaError: string | null;
  /** El navegador bloqueo el audio hasta que el usuario toque algo. */
  isAudioBlocked: boolean;
  join: (target: VoiceSessionTarget) => void;
  leave: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  toggleMutedForMe: (identity: string) => void;
  focusConnectedChannel: () => void;
  dismissNotice: () => void;
  startAudio: () => void;
  videoTrackOf: (identity: string, source: VoiceVideoSource) => Track | null;
}

const VoiceSessionContext = createContext<VoiceSessionValue | null>(null);

/**
 * La llamada de voz vive arriba de todo (en `HomeShell`) para seguir
 * conectado al cambiar de canal, de servidor o ir a Mensajes Directos.
 *
 * Pide el token al BFF y se conecta directo a LiveKit. Los eventos de la sala
 * se traducen a las acciones de `voiceSessionReducer` (client-shared), el
 * mismo estado que usa mobile con el puente del WebView.
 */
export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    voiceSessionReducer,
    initialVoiceSessionState,
  );
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const audioHostRef = useRef<HTMLDivElement>(null);
  // Cada `join` o `leave` invalida lo que este en vuelo de antes.
  const attemptRef = useRef(0);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const syncParticipants = useCallback((room: Room) => {
    dispatch({ type: "participants", participants: roomParticipants(room) });
  }, []);

  const applyVolumes = useCallback((room: Room) => {
    const { mutedForMe } = stateRef.current;
    room.remoteParticipants.forEach((participant) => {
      participant.setVolume(mutedForMe.includes(participant.identity) ? 0 : 1);
    });
  }, []);

  const teardown = useCallback((room: Room) => {
    room.removeAllListeners();
    room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        publication.track?.detach().forEach((element) => element.remove());
      });
    });
    if (roomRef.current === room) roomRef.current = null;
    setIsAudioBlocked(false);
    setMediaError(null);
  }, []);

  const applyMicrophone = useCallback(async (room: Room) => {
    // El permiso se lee de LiveKit: el estado puede no haberse actualizado.
    const canPublish = room.localParticipant.permissions?.canPublish !== false;
    const enabled = !stateRef.current.muted && canPublish;
    try {
      await room.localParticipant.setMicrophoneEnabled(enabled);
      setMediaError(null);
    } catch {
      if (!enabled) return;
      setMediaError(VOICE_MIC_DENIED);
      if (!stateRef.current.muted) dispatch({ type: "toggle_mute" });
    }
  }, []);

  const listen = useCallback(
    (room: Room) => {
      const sync = () => syncParticipants(room);
      PARTICIPANT_EVENTS.forEach((event) => room.on(event, sync));

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          audioHostRef.current?.append(track.attach());
          applyVolumes(room);
        }
        sync();
      });
      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        track.detach().forEach((element) => element.remove());
        sync();
      });
      room.on(RoomEvent.ConnectionStateChanged, (connection) => {
        if (connection === ConnectionState.Connected) {
          dispatch({ type: "status", status: "connected" });
        } else if (
          connection === ConnectionState.Reconnecting ||
          connection === ConnectionState.SignalReconnecting
        ) {
          dispatch({ type: "status", status: "reconnecting" });
        }
      });
      room.on(
        RoomEvent.ParticipantPermissionsChanged,
        (_previous, participant: Participant) => {
          if (participant !== room.localParticipant) return;
          dispatch({
            type: "speak_permission",
            allowed: participant.permissions?.canPublish !== false,
          });
        },
      );
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        setIsAudioBlocked(!room.canPlaybackAudio);
      });
    },
    [applyVolumes, syncParticipants],
  );

  // Se escucha recien conectados: si `connect()` falla, LiveKit tambien
  // dispara `Disconnected` y el aviso tiene que ser "no pudimos conectarte".
  const listenForDisconnect = useCallback(
    (room: Room) => {
      room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
        if (roomRef.current !== room) return;
        teardown(room);
        dispatch({
          type: "ended",
          notice: voiceDisconnectMessage(toVoiceDisconnectReason(reason)),
        });
      });
    },
    [teardown],
  );

  const join = useCallback(
    async (target: VoiceSessionTarget) => {
      if (stateRef.current.target?.channelId === target.channelId) return;
      const attempt = ++attemptRef.current;

      // Cambiar de canal: signaling ya saca la sesion vieja al pedir el token.
      const previous = roomRef.current;
      if (previous) {
        teardown(previous);
        void previous.disconnect();
      }
      dispatch({ type: "join_requested", target });

      const result = await requestVoiceTokenRequest(target.channelId);
      if (attempt !== attemptRef.current) return;
      if (!result.ok) {
        dispatch({ type: "ended", notice: result.message });
        return;
      }

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      listen(room);
      try {
        await room.connect(result.token.url, result.token.token);
      } catch {
        if (roomRef.current !== room) return;
        teardown(room);
        dispatch({ type: "ended", notice: VOICE_CONNECT_FAILED });
        return;
      }
      if (attempt !== attemptRef.current) {
        teardown(room);
        void room.disconnect();
        return;
      }
      listenForDisconnect(room);

      dispatch({ type: "status", status: "connected" });
      dispatch({
        type: "speak_permission",
        allowed: room.localParticipant.permissions?.canPublish !== false,
      });
      syncParticipants(room);
      setIsAudioBlocked(!room.canPlaybackAudio);
      await applyMicrophone(room);
    },
    [applyMicrophone, listen, listenForDisconnect, syncParticipants, teardown],
  );

  const leave = useCallback(async () => {
    attemptRef.current += 1;
    const channelId = stateRef.current.target?.channelId;
    const room = roomRef.current;
    if (room) {
      teardown(room);
      void room.disconnect();
    }
    dispatch({ type: "ended", notice: null });
    if (!channelId) return;

    const result = await leaveVoiceSessionRequest(channelId);
    if (!result.ok && stateRef.current.target === null) {
      dispatch({ type: "ended", notice: result.message });
    }
  }, [teardown]);

  // El mic, la camara y la pantalla siguen al estado: el boton cambia el
  // estado y aca se aplica en LiveKit. Si falla, se vuelve atras.
  const { muted, canSpeak, cameraOn, screenSharing, mutedForMe } = state;
  useEffect(() => {
    const room = roomRef.current;
    if (room?.state !== ConnectionState.Connected) return;
    void applyMicrophone(room);
  }, [muted, canSpeak, applyMicrophone]);

  useEffect(() => {
    const room = roomRef.current;
    if (room?.state !== ConnectionState.Connected) return;
    room.localParticipant.setCameraEnabled(cameraOn).catch(() => {
      if (stateRef.current.cameraOn === cameraOn) {
        dispatch({ type: "toggle_camera" });
      }
    });
  }, [cameraOn]);

  useEffect(() => {
    const room = roomRef.current;
    if (room?.state !== ConnectionState.Connected) return;
    // Cancelar el selector de pantalla del navegador tambien cae aca.
    room.localParticipant.setScreenShareEnabled(screenSharing).catch(() => {
      if (stateRef.current.screenSharing === screenSharing) {
        dispatch({ type: "toggle_screen_share" });
      }
    });
  }, [screenSharing]);

  useEffect(() => {
    const room = roomRef.current;
    if (room) applyVolumes(room);
  }, [mutedForMe, applyVolumes]);

  // Cerrar sesion (o salir de la home) corta la llamada.
  useEffect(
    () => () => {
      const room = roomRef.current;
      const channelId = stateRef.current.target?.channelId;
      if (room) {
        teardown(room);
        void room.disconnect();
      }
      if (channelId) void leaveVoiceSessionRequest(channelId);
    },
    [teardown],
  );

  const startJoin = useCallback(
    (target: VoiceSessionTarget) => void join(target),
    [join],
  );
  const startLeave = useCallback(() => void leave(), [leave]);
  const toggleMute = useCallback(() => dispatch({ type: "toggle_mute" }), []);
  const toggleCamera = useCallback(
    () => dispatch({ type: "toggle_camera" }),
    [],
  );
  const toggleScreenShare = useCallback(
    () => dispatch({ type: "toggle_screen_share" }),
    [],
  );
  const toggleMutedForMe = useCallback(
    (identity: string) => dispatch({ type: "toggle_muted_for_me", identity }),
    [],
  );
  const focusConnectedChannel = useCallback(
    () => dispatch({ type: "focus" }),
    [],
  );
  const dismissNotice = useCallback(
    () => dispatch({ type: "dismiss_notice" }),
    [],
  );
  const startAudio = useCallback(() => {
    void roomRef.current?.startAudio();
  }, []);

  const videoTrackOf = useCallback(
    (identity: string, source: VoiceVideoSource): Track | null => {
      const room = roomRef.current;
      if (!room) return null;
      const participant =
        room.localParticipant.identity === identity
          ? room.localParticipant
          : room.remoteParticipants.get(identity);
      const publication = participant?.getTrackPublication(
        source === "camera" ? Track.Source.Camera : Track.Source.ScreenShare,
      );
      return publication && !publication.isMuted
        ? (publication.track ?? null)
        : null;
    },
    [],
  );

  const value = useMemo(
    () => ({
      state,
      mediaError,
      isAudioBlocked,
      join: startJoin,
      leave: startLeave,
      toggleMute,
      toggleCamera,
      toggleScreenShare,
      toggleMutedForMe,
      focusConnectedChannel,
      dismissNotice,
      startAudio,
      videoTrackOf,
    }),
    [
      state,
      mediaError,
      isAudioBlocked,
      startJoin,
      startLeave,
      toggleMute,
      toggleCamera,
      toggleScreenShare,
      toggleMutedForMe,
      focusConnectedChannel,
      dismissNotice,
      startAudio,
      videoTrackOf,
    ],
  );

  return (
    <VoiceSessionContext.Provider value={value}>
      {children}
      {/* El audio de los demas: vive aca para seguir sonando en cualquier vista. */}
      <div ref={audioHostRef} hidden aria-hidden />
    </VoiceSessionContext.Provider>
  );
}

export function useVoiceSession(): VoiceSessionValue {
  const value = useContext(VoiceSessionContext);
  if (!value) {
    throw new Error(
      "useVoiceSession debe usarse dentro de <VoiceSessionProvider>",
    );
  }
  return value;
}

/** Para piezas que tambien se usan fuera de la home (y en tests): sin provider, `null`. */
export function useOptionalVoiceSession(): VoiceSessionValue | null {
  return useContext(VoiceSessionContext);
}
