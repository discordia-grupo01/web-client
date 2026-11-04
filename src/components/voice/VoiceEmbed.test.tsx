import {
  serializeVoiceBridgeMessage,
  voiceTileFullscreenLabel,
  type VoiceBridgeCommand,
  type VoiceBridgeEvent,
  type VoiceParticipant,
} from "@discordia/client-shared";

import { act, fireEvent, render, screen } from "@testing-library/react";
import type { Track } from "livekit-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DOUBLE_TAP_MS } from "./hooks/useTapOrDoubleTap";
import { VoiceEmbed } from "./VoiceEmbed";

const track = { attach: vi.fn(), detach: vi.fn() } as unknown as Track;

const session = vi.hoisted(() => ({
  post: null as ((event: VoiceBridgeEvent) => void) | null,
}));

vi.mock("@/components/voice/utils/voiceEmbedSession", () => ({
  createVoiceEmbedSession: (post: (event: VoiceBridgeEvent) => void) => {
    session.post = post;
    return {
      handle: vi.fn(),
      dispose: vi.fn(),
      videoOf: (identity: string) =>
        identity === "u-pixel:screen" ? { track, source: "screen" } : null,
    };
  },
}));

vi.mock("@/components/voice/hooks/useElementSize", () => ({
  useElementSize: () => [{ current: null }, { width: 800, height: 600 }],
}));

const pixel: VoiceParticipant = {
  identity: "u-pixel",
  name: "PixelHunter",
  isLocal: false,
  muted: false,
  speaking: false,
  cameraOn: false,
  screenSharing: true,
  mutedForMe: false,
};

const postMessage = vi.fn();

beforeEach(() => {
  window.ReactNativeWebView = { postMessage };
});

afterEach(() => {
  delete window.ReactNativeWebView;
  postMessage.mockClear();
});

function sendCommand(command: VoiceBridgeCommand) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: serializeVoiceBridgeMessage(command),
      }),
    );
  });
}

function joinCall(canExpand?: boolean) {
  render(<VoiceEmbed />);
  sendCommand({
    type: "setAppearance",
    theme: "dark",
    localAvatarUrl: null,
    ...(canExpand === undefined ? {} : { canExpand }),
  });
  act(() => session.post?.({ type: "participants", participants: [pixel] }));
}

const expandButton = () =>
  screen.queryByRole("button", {
    name: voiceTileFullscreenLabel({ ...pixel, identity: "u-pixel:screen" }),
  });

describe("VoiceEmbed en pantalla grande", () => {
  it("no ofrece pantalla grande si la app no la soporta", () => {
    joinCall();
    expect(expandButton()).not.toBeInTheDocument();
  });

  it("si la app la soporta, el boton le pide ampliar a la app", () => {
    joinCall(true);

    act(() => fireEvent.click(expandButton()!));

    expect(postMessage).toHaveBeenCalledWith(
      serializeVoiceBridgeMessage({
        type: "expandRequested",
        identity: "u-pixel:screen",
      }),
    );
  });

  it("muestra solo a quien la app amplio y vuelve a la grilla con null", () => {
    joinCall(true);

    sendCommand({ type: "setExpanded", identity: "u-pixel:screen" });
    expect(
      screen.getByRole("img", { name: "Pantalla de PixelHunter" }),
    ).toBeInTheDocument();
    expect(expandButton()).not.toBeInTheDocument();

    sendCommand({ type: "setExpanded", identity: null });
    expect(
      screen.queryByRole("img", { name: "Pantalla de PixelHunter" }),
    ).not.toBeInTheDocument();
    expect(expandButton()).toBeInTheDocument();
  });

  it("muestra a la persona y a su pantalla en tiles separados", () => {
    joinCall(true);
    expect(screen.getByText("PixelHunter")).toBeInTheDocument();
    expect(screen.getByText("Pantalla de PixelHunter")).toBeInTheDocument();
  });

  it("sigue en la grilla si la persona ya no tiene video", () => {
    joinCall(true);

    sendCommand({ type: "setExpanded", identity: "u-otro" });

    expect(
      screen.queryByRole("img", { name: "Pantalla de PixelHunter" }),
    ).not.toBeInTheDocument();
    expect(expandButton()).toBeInTheDocument();
  });
});

describe("VoiceEmbed con perfiles de la app", () => {
  const callPartner: VoiceParticipant = {
    ...pixel,
    identity: "u-beto",
    name: "u-beto",
  };

  it("muestra el nombre que manda la app en vez del id", () => {
    render(<VoiceEmbed />);
    act(() =>
      session.post?.({ type: "participants", participants: [callPartner] }),
    );
    expect(screen.getByText("u-beto")).toBeInTheDocument();

    sendCommand({
      type: "setParticipantProfiles",
      profiles: [{ identity: "u-beto", name: "Beto", avatarUrl: null }],
    });

    expect(screen.getByText("Beto")).toBeInTheDocument();
    expect(screen.queryByText("u-beto")).not.toBeInTheDocument();
  });
});

describe("VoiceEmbed con doble toque", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const tile = () => screen.getByText("PixelHunter").closest("div.group")!;

  it("un toque pide la lista de participantes", () => {
    joinCall(true);

    act(() => fireEvent.click(tile()));
    act(() => vi.advanceTimersByTime(DOUBLE_TAP_MS));

    expect(postMessage).toHaveBeenCalledWith(
      serializeVoiceBridgeMessage({ type: "participantsRequested" }),
    );
  });

  it("dos toques le piden a la app fijar a esa persona", () => {
    joinCall(true);

    act(() => {
      fireEvent.click(tile());
      fireEvent.click(tile());
    });
    act(() => vi.advanceTimersByTime(DOUBLE_TAP_MS));

    expect(postMessage).toHaveBeenCalledWith(
      serializeVoiceBridgeMessage({
        type: "pinRequested",
        identity: "u-pixel",
      }),
    );
    expect(postMessage).not.toHaveBeenCalledWith(
      serializeVoiceBridgeMessage({ type: "participantsRequested" }),
    );
  });
});
