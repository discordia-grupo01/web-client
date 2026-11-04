import {
  type MessageAuthor,
  PRIVATE_CALL_BLOCKED_HINT,
  PRIVATE_CALL_START,
} from "@discordia/client-shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DmCallButton } from "./DmCallButton";

const privateCall = vi.hoisted(() => ({
  state: { phase: "idle" },
  start: vi.fn(),
}));
vi.mock("@/contexts/PrivateCallContext", () => ({
  useOptionalPrivateCall: () => privateCall,
}));

const beto: MessageAuthor = {
  id: "beto",
  name: "Beto",
  avatarUrl: null,
  roleName: null,
  roleColor: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  privateCall.state = { phase: "idle" };
});

describe("DmCallButton", () => {
  it("llama al otro participante de la conversacion", () => {
    render(
      <DmCallButton
        partner={beto}
        conversationId="conv-1"
        blockedByMe={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: PRIVATE_CALL_START }));

    expect(privateCall.start).toHaveBeenCalledWith(
      { id: "beto", name: "Beto", avatarUrl: null },
      "conv-1",
    );
  });

  it("con un bloqueo no deja llamar y explica por que", () => {
    render(<DmCallButton partner={beto} conversationId="conv-1" blockedByMe />);

    expect(
      screen.getByRole("button", { name: PRIVATE_CALL_BLOCKED_HINT }),
    ).toBeDisabled();
  });

  it("en un borrador todavia no se puede llamar", () => {
    render(
      <DmCallButton partner={beto} conversationId={null} blockedByMe={false} />,
    );

    expect(
      screen.getByRole("button", { name: PRIVATE_CALL_START }),
    ).toBeDisabled();
  });

  it("no deja iniciar otra llamada si ya hay una", () => {
    privateCall.state = { phase: "in_call" };
    render(
      <DmCallButton
        partner={beto}
        conversationId="conv-1"
        blockedByMe={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: PRIVATE_CALL_START }),
    ).toBeDisabled();
  });
});
