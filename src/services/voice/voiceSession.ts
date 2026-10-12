import {
  sortVoiceParticipants,
  type VoiceConnectionStatus,
  type VoiceParticipant,
} from "@discordia/client-shared";

export interface VoiceSessionTarget {
  serverId: string;
  serverName: string;
  channelId: string;
  channelName: string;
}

export interface VoiceSelf {
  identity: string;
  name: string;
}

export interface VoiceSessionState {
  target: VoiceSessionTarget | null;
  status: VoiceConnectionStatus;
  muted: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  remotes: VoiceParticipant[];
  mutedForMe: string[];
  focus: { serverId: string; channelId: string; nonce: number } | null;
}

export type VoiceSessionAction =
  | { type: "join"; target: VoiceSessionTarget; remotes: VoiceParticipant[] }
  | { type: "connected" }
  | { type: "leave" }
  | { type: "toggle_mute" }
  | { type: "toggle_camera" }
  | { type: "toggle_screen_share" }
  | { type: "toggle_muted_for_me"; identity: string }
  | { type: "set_speaking"; identities: readonly string[] }
  | { type: "focus" };

export const initialVoiceSessionState: VoiceSessionState = {
  target: null,
  status: "idle",
  muted: false,
  cameraOn: false,
  screenSharing: false,
  remotes: [],
  mutedForMe: [],
  focus: null,
};

export function voiceSessionReducer(
  state: VoiceSessionState,
  action: VoiceSessionAction,
): VoiceSessionState {
  switch (action.type) {
    case "join":
      if (state.target?.channelId === action.target.channelId) return state;
      return {
        ...state,
        target: action.target,
        status: "connecting",
        cameraOn: false,
        screenSharing: false,
        remotes: action.remotes,
        mutedForMe: [],
      };
    case "connected":
      return state.status === "connecting"
        ? { ...state, status: "connected" }
        : state;
    case "leave":
      return { ...initialVoiceSessionState, muted: state.muted };
    case "toggle_mute":
      return { ...state, muted: !state.muted };
    case "toggle_camera":
      return state.target ? { ...state, cameraOn: !state.cameraOn } : state;
    case "toggle_screen_share":
      return state.target
        ? { ...state, screenSharing: !state.screenSharing }
        : state;
    case "toggle_muted_for_me": {
      const isMuted = state.mutedForMe.includes(action.identity);
      return {
        ...state,
        mutedForMe: isMuted
          ? state.mutedForMe.filter((id) => id !== action.identity)
          : [...state.mutedForMe, action.identity],
      };
    }
    case "set_speaking":
      return {
        ...state,
        remotes: state.remotes.map((participant) => ({
          ...participant,
          speaking:
            !participant.muted &&
            action.identities.includes(participant.identity),
        })),
      };
    case "focus":
      return state.target
        ? {
            ...state,
            focus: {
              serverId: state.target.serverId,
              channelId: state.target.channelId,
              nonce: (state.focus?.nonce ?? 0) + 1,
            },
          }
        : state;
  }
}

export function voiceParticipantsOf(
  state: VoiceSessionState,
  self: VoiceSelf,
): VoiceParticipant[] {
  if (!state.target) return [];
  const local: VoiceParticipant = {
    identity: self.identity,
    name: self.name,
    isLocal: true,
    muted: state.muted,
    speaking: false,
    cameraOn: state.cameraOn,
    screenSharing: state.screenSharing,
    mutedForMe: false,
  };
  const remotes = state.remotes.map((participant) => ({
    ...participant,
    mutedForMe: state.mutedForMe.includes(participant.identity),
  }));
  return sortVoiceParticipants([local, ...remotes]);
}
