import {
  ACCOUNT_RECOVERY_CHALLENGE_EXPIRED,
  ACCOUNT_RECOVERY_UNAVAILABLE,
} from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { twoFactorRecoveryRequest } from "@/services/two-factor/client";

import { RecoveryRequestForm } from "./RecoveryRequestForm";

vi.mock("@/services/two-factor/client", () => ({
  twoFactorRecoveryRequest: vi.fn(),
}));

const twoFactorRecoveryRequestMock = vi.mocked(twoFactorRecoveryRequest);

function renderForm() {
  const handlers = {
    onCancel: vi.fn(),
    onSent: vi.fn(),
    onAlreadyPending: vi.fn(),
    onChallengeLost: vi.fn(),
  };
  render(<RecoveryRequestForm {...handlers} />);
  return handlers;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<RecoveryRequestForm />", () => {
  it("se puede enviar sin mensaje y pasa el email enmascarado", async () => {
    twoFactorRecoveryRequestMock.mockResolvedValue({
      ok: true,
      emailHint: "a***a@gmail.com",
    });
    const { onSent } = renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: /enviar solicitud/i }),
    );

    expect(twoFactorRecoveryRequestMock).toHaveBeenCalledWith("");
    expect(onSent).toHaveBeenCalledWith("a***a@gmail.com");
  });

  it("manda el mensaje sin los espacios de los bordes", async () => {
    twoFactorRecoveryRequestMock.mockResolvedValue({
      ok: true,
      emailHint: "a***a@gmail.com",
    });
    renderForm();

    await userEvent.type(
      screen.getByLabelText(/contanos qué pasó/i),
      "  perdí el celular  ",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /enviar solicitud/i }),
    );

    expect(twoFactorRecoveryRequestMock).toHaveBeenCalledWith(
      "perdí el celular",
    );
  });

  it("si ya había una pendiente avisa al llamador", async () => {
    twoFactorRecoveryRequestMock.mockResolvedValue({
      ok: true,
      alreadyPending: true,
    });
    const { onAlreadyPending, onSent } = renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: /enviar solicitud/i }),
    );

    expect(onAlreadyPending).toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  it("con la verificación vencida avisa al llamador en vez de mostrar el error", async () => {
    twoFactorRecoveryRequestMock.mockResolvedValue({
      ok: false,
      message: ACCOUNT_RECOVERY_CHALLENGE_EXPIRED,
      expired: true,
    });
    const { onChallengeLost } = renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: /enviar solicitud/i }),
    );

    expect(onChallengeLost).toHaveBeenCalledWith(
      ACCOUNT_RECOVERY_CHALLENGE_EXPIRED,
    );
  });

  it("si falla el envío muestra el error y deja reintentar", async () => {
    twoFactorRecoveryRequestMock.mockResolvedValue({
      ok: false,
      message: ACCOUNT_RECOVERY_UNAVAILABLE,
    });
    renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: /enviar solicitud/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ACCOUNT_RECOVERY_UNAVAILABLE,
    );
    expect(
      screen.getByRole("button", { name: /enviar solicitud/i }),
    ).toBeEnabled();
  });
});
