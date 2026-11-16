import {
  VOICE_CAMERA_ERROR_TITLE,
  VOICE_CAMERA_IN_USE,
  VOICE_MIC_DENIED,
  VOICE_MIC_ERROR_TITLE,
} from "@discordia/client-shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VoiceMediaErrorDialog } from "./VoiceMediaErrorDialog";

describe("VoiceMediaErrorDialog", () => {
  it("explica por que no se prendio el microfono", () => {
    render(<VoiceMediaErrorDialog error="mic_denied" onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveTextContent(VOICE_MIC_ERROR_TITLE);
    expect(screen.getByText(VOICE_MIC_DENIED)).toBeInTheDocument();
  });

  it("distingue la camara ocupada", () => {
    render(<VoiceMediaErrorDialog error="camera_in_use" onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveTextContent(
      VOICE_CAMERA_ERROR_TITLE,
    );
    expect(screen.getByText(VOICE_CAMERA_IN_USE)).toBeInTheDocument();
  });

  it("se cierra con Entendido", () => {
    const onClose = vi.fn();
    render(<VoiceMediaErrorDialog error="mic_in_use" onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));

    expect(onClose).toHaveBeenCalled();
  });
});
