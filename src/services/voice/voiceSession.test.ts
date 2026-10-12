import type { Channel, VoiceParticipant } from "@discordia/client-shared";

import { describe, expect, it } from "vitest";

import { mockPresenceFor, mockRemotesFor, pickMockSpeakers } from "./mockVoice";
import {
  initialVoiceSessionState,
  voiceParticipantsOf,
  voiceSessionReducer,
  type VoiceSessionState,
  type VoiceSessionTarget,
} from "./voiceSession";

const general: VoiceSessionTarget = {
  serverId: "s1",
  serverName: "Discordia HQ",
  channelId: "voz-1",
  channelName: "General",
};
const gaming: VoiceSessionTarget = {
  ...general,
  channelId: "voz-2",
  channelName: "Gaming Room",
};

function remote(
  identity: string,
  overrides: Partial<VoiceParticipant> = {},
): VoiceParticipant {
  return {
    identity,
    name: identity,
    isLocal: false,
    muted: false,
    speaking: false,
    cameraOn: false,
    screenSharing: false,
    mutedForMe: false,
    ...overrides,
  };
}

function joined(remotes: VoiceParticipant[] = []): VoiceSessionState {
  const connecting = voiceSessionReducer(initialVoiceSessionState, {
    type: "join",
    target: general,
    remotes,
  });
  return voiceSessionReducer(connecting, { type: "connected" });
}

describe("voiceSessionReducer", () => {
  it("entra conectando y pasa a conectado", () => {
    const connecting = voiceSessionReducer(initialVoiceSessionState, {
      type: "join",
      target: general,
      remotes: [],
    });
    expect(connecting.status).toBe("connecting");
    expect(voiceSessionReducer(connecting, { type: "connected" }).status).toBe(
      "connected",
    );
  });

  it("al cambiar de canal conserva el mute pero corta camara y pantalla", () => {
    let state = joined([remote("ana")]);
    state = voiceSessionReducer(state, { type: "toggle_mute" });
    state = voiceSessionReducer(state, { type: "toggle_camera" });
    state = voiceSessionReducer(state, { type: "toggle_screen_share" });
    state = voiceSessionReducer(state, {
      type: "toggle_muted_for_me",
      identity: "ana",
    });

    const switched = voiceSessionReducer(state, {
      type: "join",
      target: gaming,
      remotes: [],
    });

    expect(switched.target).toEqual(gaming);
    expect(switched.status).toBe("connecting");
    expect(switched.muted).toBe(true);
    expect(switched.cameraOn).toBe(false);
    expect(switched.screenSharing).toBe(false);
    expect(switched.mutedForMe).toEqual([]);
  });

  it("volver a entrar al mismo canal no reinicia la llamada", () => {
    const state = joined([remote("ana")]);
    expect(
      voiceSessionReducer(state, {
        type: "join",
        target: general,
        remotes: [],
      }),
    ).toBe(state);
  });

  it("salir limpia la sesion", () => {
    const left = voiceSessionReducer(joined([remote("ana")]), {
      type: "leave",
    });
    expect(left.target).toBeNull();
    expect(left.status).toBe("idle");
    expect(left.remotes).toEqual([]);
  });

  it("camara y pantalla no se prenden sin llamada", () => {
    const state = voiceSessionReducer(initialVoiceSessionState, {
      type: "toggle_camera",
    });
    expect(state.cameraOn).toBe(false);
  });

  it("un muteado no figura hablando", () => {
    const state = voiceSessionReducer(
      joined([remote("ana"), remote("beto", { muted: true })]),
      { type: "set_speaking", identities: ["ana", "beto"] },
    );
    expect(state.remotes.map((p) => [p.identity, p.speaking])).toEqual([
      ["ana", true],
      ["beto", false],
    ]);
  });

  it("silenciar para mi alterna", () => {
    let state = joined([remote("ana")]);
    state = voiceSessionReducer(state, {
      type: "toggle_muted_for_me",
      identity: "ana",
    });
    expect(state.mutedForMe).toEqual(["ana"]);
    state = voiceSessionReducer(state, {
      type: "toggle_muted_for_me",
      identity: "ana",
    });
    expect(state.mutedForMe).toEqual([]);
  });

  it("cada pedido de ir al canal cambia el nonce", () => {
    const first = voiceSessionReducer(joined(), { type: "focus" });
    const second = voiceSessionReducer(first, { type: "focus" });
    expect(first.focus).toEqual({
      serverId: "s1",
      channelId: "voz-1",
      nonce: 1,
    });
    expect(second.focus?.nonce).toBe(2);
  });
});

describe("voiceParticipantsOf", () => {
  it("pone a uno primero y aplica el silenciar para mi", () => {
    let state = joined([remote("Zoe"), remote("Ana")]);
    state = voiceSessionReducer(state, { type: "toggle_mute" });
    state = voiceSessionReducer(state, {
      type: "toggle_muted_for_me",
      identity: "Zoe",
    });

    const participants = voiceParticipantsOf(state, {
      identity: "yo",
      name: "Yo",
    });

    expect(participants.map((p) => p.identity)).toEqual(["yo", "Ana", "Zoe"]);
    expect(participants[0]).toMatchObject({ isLocal: true, muted: true });
    expect(participants[2]?.mutedForMe).toBe(true);
  });

  it("sin llamada no hay nadie", () => {
    expect(
      voiceParticipantsOf(initialVoiceSessionState, {
        identity: "yo",
        name: "Yo",
      }),
    ).toEqual([]);
  });
});

describe("mockVoice", () => {
  const channels: Channel[] = [
    {
      id: "t",
      name: "general",
      kind: "text",
      position: 0,
      category_id: null,
      topic: null,
    },
    {
      id: "v1",
      name: "General",
      kind: "voice",
      position: 1,
      category_id: null,
      topic: null,
    },
    {
      id: "v2",
      name: "Gaming",
      kind: "voice",
      position: 2,
      category_id: null,
      topic: null,
    },
  ];

  it("solo el primer canal de voz arranca con gente", () => {
    expect(Object.keys(mockPresenceFor(channels))).toEqual(["v1"]);
    expect(mockRemotesFor(channels, "v1").length).toBeGreaterThan(0);
    expect(mockRemotesFor(channels, "v2")).toEqual([]);
  });

  it("no elige muteados para hablar", () => {
    const remotes = [remote("ana", { muted: true }), remote("beto")];
    expect(pickMockSpeakers(remotes, () => 0)).toEqual(["beto"]);
    expect(pickMockSpeakers(remotes, () => 0.99)).toEqual([]);
    expect(pickMockSpeakers([remote("ana", { muted: true })])).toEqual([]);
  });
});
