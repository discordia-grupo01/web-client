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

// jsdom no implementa PointerEvent: sin esto los eventos pierden clientX y pointerId.
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
  }
}
vi.stubGlobal("PointerEvent", TestPointerEvent);

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

  it("se puede arrastrar sin que soltarlo cuente como volver a la llamada", () => {
    render(<PrivateCallBanner />);
    const banner = screen.getByRole("status");
    const backToCall = screen.getByRole("button", {
      name: "Volver a la llamada",
    });

    fireEvent.pointerDown(backToCall, {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(backToCall, {
      pointerId: 1,
      clientX: 150,
      clientY: 180,
    });
    fireEvent.pointerUp(backToCall, { pointerId: 1 });
    fireEvent.click(backToCall);

    expect(banner.style.transform).toBe("translate3d(50px, 80px, 0)");
    expect(privateCall.restore).not.toHaveBeenCalled();
  });

  it("un toque sin mover sigue volviendo a la llamada", () => {
    render(<PrivateCallBanner />);
    const backToCall = screen.getByRole("button", {
      name: "Volver a la llamada",
    });

    fireEvent.pointerDown(backToCall, {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(backToCall, {
      pointerId: 1,
      clientX: 103,
      clientY: 102,
    });
    fireEvent.pointerUp(backToCall, { pointerId: 1 });
    fireEvent.click(backToCall);

    expect(privateCall.restore).toHaveBeenCalledTimes(1);
  });
});
