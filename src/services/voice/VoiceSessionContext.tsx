"use client";

import type { Channel } from "@discordia/client-shared";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import { mockRemotesFor, pickMockSpeakers } from "./mockVoice";
import {
  initialVoiceSessionState,
  voiceSessionReducer,
  type VoiceSessionState,
  type VoiceSessionTarget,
} from "./voiceSession";

const MOCK_CONNECT_DELAY_MS = 700;
const MOCK_SPEAKING_INTERVAL_MS = 1600;

interface VoiceSessionValue {
  state: VoiceSessionState;
  join: (target: VoiceSessionTarget, channels: readonly Channel[]) => void;
  leave: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  toggleMutedForMe: (identity: string) => void;
  focusConnectedChannel: () => void;
}

const VoiceSessionContext = createContext<VoiceSessionValue | null>(null);

export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    voiceSessionReducer,
    initialVoiceSessionState,
  );

  const channelId = state.target?.channelId;
  useEffect(() => {
    if (state.status !== "connecting") return;
    const timer = setTimeout(
      () => dispatch({ type: "connected" }),
      MOCK_CONNECT_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [state.status, channelId]);

  const remotes = state.remotes;
  const isConnected = state.status === "connected";
  useEffect(() => {
    if (!isConnected || remotes.length === 0) return;
    const timer = setTimeout(
      () =>
        dispatch({
          type: "set_speaking",
          identities: pickMockSpeakers(remotes),
        }),
      MOCK_SPEAKING_INTERVAL_MS,
    );
    return () => clearTimeout(timer);
  }, [isConnected, remotes]);

  const join = useCallback(
    (target: VoiceSessionTarget, channels: readonly Channel[]) =>
      dispatch({
        type: "join",
        target,
        remotes: mockRemotesFor(channels, target.channelId),
      }),
    [],
  );
  const leave = useCallback(() => dispatch({ type: "leave" }), []);
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

  const value = useMemo(
    () => ({
      state,
      join,
      leave,
      toggleMute,
      toggleCamera,
      toggleScreenShare,
      toggleMutedForMe,
      focusConnectedChannel,
    }),
    [
      state,
      join,
      leave,
      toggleMute,
      toggleCamera,
      toggleScreenShare,
      toggleMutedForMe,
      focusConnectedChannel,
    ],
  );

  return (
    <VoiceSessionContext.Provider value={value}>
      {children}
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
