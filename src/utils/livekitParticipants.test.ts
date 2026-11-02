import { DisconnectReason, Track } from "livekit-client";
import { describe, expect, it } from "vitest";

import {
  audioOwnerOf,
  roomParticipants,
  tileVideoOf,
  toVoiceDisconnectReason,
  toVoiceParticipant,
} from "@/utils/livekitParticipants";

function participant(identity: string, overrides = {}) {
  return {
    identity,
    name: identity.toUpperCase(),
    isMicrophoneEnabled: true,
    isSpeaking: false,
    isCameraEnabled: false,
    isScreenShareEnabled: false,
    ...overrides,
  };
}

describe("toVoiceParticipant", () => {
  it("toma el estado de los tracks", () => {
    expect(
      toVoiceParticipant(
        participant("ana", {
          isMicrophoneEnabled: false,
          isSpeaking: true,
          isCameraEnabled: true,
        }),
        false,
      ),
    ).toEqual({
      identity: "ana",
      name: "ANA",
      isLocal: false,
      muted: true,
      speaking: true,
      cameraOn: true,
      screenSharing: false,
      mutedForMe: false,
    });
  });

  it("sin nombre usa la identidad", () => {
    expect(
      toVoiceParticipant(participant("ana", { name: "" }), false).name,
    ).toBe("ana");
  });
});

describe("roomParticipants", () => {
  it("pone al local y despues a los remotos", () => {
    const room = {
      localParticipant: participant("yo"),
      remoteParticipants: new Map([["ana", participant("ana")]]),
    };

    const result = roomParticipants(room);

    expect(result.map((p) => [p.identity, p.isLocal])).toEqual([
      ["yo", true],
      ["ana", false],
    ]);
  });
});

describe("roomParticipants con pantalla compartida desde el celular", () => {
  it("pega la conexion de pantalla a la tarjeta de su dueño", () => {
    const room = {
      localParticipant: participant("yo"),
      remoteParticipants: new Map([
        ["ana", participant("ana")],
        [
          "ana:screen",
          participant("ana:screen", {
            isMicrophoneEnabled: false,
            isScreenShareEnabled: true,
          }),
        ],
      ]),
    };

    const result = roomParticipants(room);

    expect(result.map((p) => [p.identity, p.screenSharing])).toEqual([
      ["yo", false],
      ["ana", true],
    ]);
  });

  it("tambien cuando la pantalla es la tuya", () => {
    const room = {
      localParticipant: participant("yo"),
      remoteParticipants: new Map([
        ["yo:screen", participant("yo:screen", { isScreenShareEnabled: true })],
      ]),
    };

    expect(roomParticipants(room)).toEqual([
      expect.objectContaining({
        identity: "yo",
        isLocal: true,
        screenSharing: true,
      }),
    ]);
  });
});

describe("audioOwnerOf", () => {
  it("el audio de la pantalla del celular es de su dueño", () => {
    expect(audioOwnerOf("ana:screen")).toBe("ana");
    expect(audioOwnerOf("ana")).toBe("ana");
  });
});

describe("toVoiceDisconnectReason", () => {
  it.each([
    [DisconnectReason.CLIENT_INITIATED, "client"],
    [DisconnectReason.PARTICIPANT_REMOVED, "removed"],
    [DisconnectReason.DUPLICATE_IDENTITY, "removed"],
    [DisconnectReason.ROOM_DELETED, "room_closed"],
    [DisconnectReason.SIGNAL_CLOSE, "error"],
    [undefined, "error"],
  ])("%s -> %s", (reason, expected) => {
    expect(toVoiceDisconnectReason(reason)).toBe(expected);
  });
});

describe("tileVideoOf", () => {
  function videoParticipant(
    identity: string,
    tracks: Partial<Record<Track.Source, { isMuted: boolean; track?: string }>>,
  ) {
    return {
      identity,
      getTrackPublication: (source: Track.Source) => tracks[source],
    };
  }

  const room = {
    localParticipant: videoParticipant("ana", {
      [Track.Source.Camera]: { isMuted: false, track: "camara-ana" },
    }),
    remoteParticipants: new Map([
      [
        "beto",
        videoParticipant("beto", {
          [Track.Source.Camera]: { isMuted: false, track: "camara-beto" },
          [Track.Source.ScreenShare]: {
            isMuted: false,
            track: "pantalla-beto",
          },
        }),
      ],
      [
        "caro",
        videoParticipant("caro", {
          [Track.Source.Camera]: { isMuted: true, track: "camara-caro" },
        }),
      ],
    ]),
  };

  it("la pantalla compartida le gana a la camara", () => {
    expect(tileVideoOf(room, "beto")).toEqual({
      track: "pantalla-beto",
      source: "screen",
    });
  });

  it("encuentra la camara propia", () => {
    expect(tileVideoOf(room, "ana")).toEqual({
      track: "camara-ana",
      source: "camera",
    });
  });

  it("muestra en la tarjeta del dueño la pantalla que comparte desde el celular", () => {
    const withPhone = {
      ...room,
      remoteParticipants: new Map([
        ...room.remoteParticipants,
        [
          "caro:screen",
          videoParticipant("caro:screen", {
            [Track.Source.ScreenShare]: {
              isMuted: false,
              track: "pantalla-caro",
            },
          }),
        ],
      ]),
    };

    expect(tileVideoOf(withPhone, "caro")).toEqual({
      track: "pantalla-caro",
      source: "screen",
    });
  });

  it("sin el track bajado no hay video de pantalla", () => {
    const ownPhone = {
      ...room,
      remoteParticipants: new Map([
        ...room.remoteParticipants,
        [
          "ana:screen",
          videoParticipant("ana:screen", {
            [Track.Source.ScreenShare]: { isMuted: false },
          }),
        ],
      ]),
    };

    expect(tileVideoOf(ownPhone, "ana")).toEqual({
      track: "camara-ana",
      source: "camera",
    });
  });

  it("una camara apagada o alguien que no esta no tienen video", () => {
    expect(tileVideoOf(room, "caro")).toBeNull();
    expect(tileVideoOf(room, "nadie")).toBeNull();
  });
});
