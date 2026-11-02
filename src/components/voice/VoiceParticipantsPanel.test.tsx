import type { VoiceParticipant } from "@discordia/client-shared";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VoiceParticipantsPanel } from "./VoiceParticipantsPanel";

const person = (
  identity: string,
  overrides: Partial<VoiceParticipant> = {},
): VoiceParticipant => ({
  identity,
  name: identity,
  isLocal: false,
  muted: false,
  speaking: false,
  cameraOn: false,
  screenSharing: false,
  mutedForMe: false,
  ...overrides,
});

function renderPanel(
  participants: VoiceParticipant[],
  pinnedIdentity: string | null = null,
) {
  const onPinChange = vi.fn();
  render(
    <VoiceParticipantsPanel
      participants={participants}
      ownAvatarSrc={null}
      pinnedIdentity={pinnedIdentity}
      onToggleMutedForMe={vi.fn()}
      onPinChange={onPinChange}
      onClose={vi.fn()}
    />,
  );
  return onPinChange;
}

describe("VoiceParticipantsPanel con pantallas compartidas", () => {
  it("permite fijar la pantalla aparte de la persona", () => {
    const onPinChange = renderPanel([person("Ana", { screenSharing: true })]);

    fireEvent.click(
      screen.getByRole("button", { name: "Fijar la pantalla de Ana" }),
    );
    expect(onPinChange).toHaveBeenCalledWith("Ana:screen");

    fireEvent.click(screen.getByRole("button", { name: "Fijar a Ana" }));
    expect(onPinChange).toHaveBeenCalledWith("Ana");
  });

  it("marca la pantalla fijada y permite soltarla", () => {
    const onPinChange = renderPanel(
      [person("Ana", { screenSharing: true })],
      "Ana:screen",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Dejar de fijar la pantalla de Ana" }),
    );
    expect(onPinChange).toHaveBeenCalledWith(null);
  });

  it("no lista tu propia pantalla", () => {
    renderPanel([person("yo", { isLocal: true, screenSharing: true })]);
    expect(screen.queryByText("Tu pantalla")).not.toBeInTheDocument();
  });
});
