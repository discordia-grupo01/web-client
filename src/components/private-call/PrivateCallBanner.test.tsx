import { PRIVATE_CALL_HANG_UP } from "@discordia/client-shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PrivateCallBanner } from "./PrivateCallBanner";

const privateCall = vi.hoisted(() => ({
  isMinimized: true,
  connectedAt: null as number | null,
  state: {
    phase: "in_call",
    partner: { id: "ana", name: "Ana", avatarUrl: null },
  },
  restore: vi.fn(),
  hangUp: vi.fn(),
}));
vi.mock("@/contexts/PrivateCallContext", () => ({
  useOptionalPrivateCall: () => privateCall,
}));

beforeEach(() => {
  vi.clearAllMocks();
  privateCall.isMinimized = true;
  privateCall.state.phase = "in_call";
});

describe("PrivateCallBanner", () => {
  it("recuerda la llamada minimizada y deja volver o cortar", () => {
    render(<PrivateCallBanner />);

    expect(screen.getByText("Llamada con Ana")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Volver a la llamada" }),
    );
    fireEvent.click(screen.getByRole("button", { name: PRIVATE_CALL_HANG_UP }));

    expect(privateCall.restore).toHaveBeenCalledTimes(1);
    expect(privateCall.hangUp).toHaveBeenCalledTimes(1);
  });

  it("no aparece con el dialogo abierto", () => {
    privateCall.isMinimized = false;
    render(<PrivateCallBanner />);

    expect(screen.queryByText("Llamada con Ana")).toBeNull();
  });

  it("no aparece mientras la llamada suena", () => {
    privateCall.state.phase = "outgoing";
    render(<PrivateCallBanner />);

    expect(screen.queryByText("Llamada con Ana")).toBeNull();
  });
});
