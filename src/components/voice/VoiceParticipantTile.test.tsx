import {
  VOICE_FULLSCREEN_EXIT_LABEL,
  VOICE_FULLSCREEN_HINT,
  voiceFullscreenLabel,
  type VoiceParticipant,
} from "@discordia/client-shared";

import { act, fireEvent, render, screen } from "@testing-library/react";
import type { Track } from "livekit-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VoiceParticipantTile } from "./VoiceParticipantTile";

const participant: VoiceParticipant = {
  identity: "u-pixel",
  name: "PixelHunter",
  isLocal: false,
  muted: false,
  speaking: false,
  cameraOn: false,
  screenSharing: true,
  mutedForMe: false,
};

const track = { attach: vi.fn(), detach: vi.fn() } as unknown as Track;
const screenVideo = { track, source: "screen" as const };

let fullscreenElement: Element | null = null;

function setFullscreenElement(element: Element | null) {
  fullscreenElement = element;
  document.dispatchEvent(new Event("fullscreenchange"));
}

beforeEach(() => {
  fullscreenElement = null;
  Object.defineProperty(document, "fullscreenEnabled", {
    configurable: true,
    get: () => true,
  });
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fullscreenElement,
  });
  HTMLElement.prototype.requestFullscreen = vi.fn(function (this: HTMLElement) {
    setFullscreenElement(this);
    return Promise.resolve();
  });
  document.exitFullscreen = vi.fn(() => {
    setFullscreenElement(null);
    return Promise.resolve();
  });
});

function renderTile(
  props: Partial<Parameters<typeof VoiceParticipantTile>[0]> = {},
) {
  return render(
    <VoiceParticipantTile
      participant={participant}
      width={640}
      height={360}
      video={screenVideo}
      {...props}
    />,
  );
}

const expandButton = () =>
  screen.queryByRole("button", { name: voiceFullscreenLabel("PixelHunter") });

describe("VoiceParticipantTile en pantalla grande", () => {
  it("ofrece pantalla grande a quien tiene video", () => {
    renderTile();
    expect(expandButton()).toBeInTheDocument();
  });

  it("no la ofrece sin video", () => {
    renderTile({ video: null });
    expect(expandButton()).not.toBeInTheDocument();
  });

  it("no la ofrece en tu propia pantalla compartida", () => {
    renderTile({ participant: { ...participant, isLocal: true } });
    expect(expandButton()).not.toBeInTheDocument();
  });

  it("si la ofrece con tu propia camara", () => {
    renderTile({
      participant: {
        ...participant,
        isLocal: true,
        screenSharing: false,
        cameraOn: true,
      },
      video: { track, source: "camera" },
    });
    expect(expandButton()).toBeInTheDocument();
  });

  it("no la ofrece si el tile lo pide (embed de mobile)", () => {
    renderTile({ canExpand: false });
    expect(expandButton()).not.toBeInTheDocument();
  });

  it("no la ofrece si el navegador no soporta pantalla completa", () => {
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      get: () => false,
    });
    renderTile();
    expect(expandButton()).not.toBeInTheDocument();
  });

  it("amplia el tile, muestra quien es y permite salir", () => {
    const onTogglePin = vi.fn();
    renderTile({ onTogglePin });

    act(() => fireEvent.click(expandButton()!));

    expect(onTogglePin).not.toHaveBeenCalled();
    expect(screen.getByText("PixelHunter")).toBeInTheDocument();
    expect(
      screen.getByText(VOICE_FULLSCREEN_HINT, { exact: false }),
    ).toBeInTheDocument();

    act(() =>
      fireEvent.click(
        screen.getByRole("button", { name: VOICE_FULLSCREEN_EXIT_LABEL }),
      ),
    );

    expect(document.exitFullscreen).toHaveBeenCalled();
    expect(expandButton()).toBeInTheDocument();
  });

  it("sale sola si la persona deja de compartir", () => {
    const { rerender } = renderTile();
    act(() => fireEvent.click(expandButton()!));

    rerender(
      <VoiceParticipantTile
        participant={{ ...participant, screenSharing: false }}
        width={640}
        height={360}
        video={null}
      />,
    );

    expect(document.exitFullscreen).toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: VOICE_FULLSCREEN_EXIT_LABEL }),
    ).not.toBeInTheDocument();
  });
});
