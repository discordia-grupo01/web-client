import {
  TWO_FACTOR_CHALLENGE_EXPIRED,
  TWO_FACTOR_CODE_INVALID,
} from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { twoFactorVerifyRequest } from "@/services/two-factor/client";

import { TwoFactorVerifyForm } from "./two-factor-verify-form";

vi.mock("@/services/two-factor/client", () => ({
  twoFactorVerifyRequest: vi.fn(),
}));

const twoFactorVerifyRequestMock = vi.mocked(twoFactorVerifyRequest);

const user = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Ada Lovelace",
  email: "ada@example.com",
  description: "",
  avatar_url: "",
  status_text: "",
  status_emoji: "",
  created_at: "2026-01-01T12:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<TwoFactorVerifyForm />", () => {
  it("no llama al backend con un codigo que no es ni TOTP ni de recuperacion", async () => {
    const typer = userEvent.setup();
    render(
      <TwoFactorVerifyForm onChallengeLost={vi.fn()} onVerified={vi.fn()} />,
    );

    await typer.type(screen.getByLabelText("Código"), "123");
    await typer.click(screen.getByRole("button", { name: /verificar/i }));

    expect(await screen.findByText(/dígitos de tu app/i)).toBeInTheDocument();
    expect(twoFactorVerifyRequestMock).not.toHaveBeenCalled();
  });

  // CA2: con el codigo correcto se completa el login.
  it("con un codigo valido avisa que la verificacion salio bien", async () => {
    twoFactorVerifyRequestMock.mockResolvedValue({
      ok: true,
      user,
      recoveryCodeUsed: false,
      recoveryCodesRemaining: 0,
    });
    const onVerified = vi.fn();
    const typer = userEvent.setup();
    render(
      <TwoFactorVerifyForm onChallengeLost={vi.fn()} onVerified={onVerified} />,
    );

    await typer.type(screen.getByLabelText("Código"), "123456");
    await typer.click(screen.getByRole("button", { name: /verificar/i }));

    expect(twoFactorVerifyRequestMock).toHaveBeenCalledWith("123456");
    expect(onVerified).toHaveBeenCalledWith({
      recoveryCodeUsed: false,
      recoveryCodesRemaining: 0,
    });
  });

  it("propaga que se uso un codigo de recuperacion y cuantos quedan", async () => {
    twoFactorVerifyRequestMock.mockResolvedValue({
      ok: true,
      user,
      recoveryCodeUsed: true,
      recoveryCodesRemaining: 9,
    });
    const onVerified = vi.fn();
    const typer = userEvent.setup();
    render(
      <TwoFactorVerifyForm onChallengeLost={vi.fn()} onVerified={onVerified} />,
    );

    await typer.click(
      screen.getByRole("button", { name: /no tengo acceso a mi app/i }),
    );
    await typer.type(
      screen.getByLabelText("Código de recuperación"),
      "A1B2C-D3E4F",
    );
    await typer.click(screen.getByRole("button", { name: /verificar/i }));

    expect(twoFactorVerifyRequestMock).toHaveBeenCalledWith("A1B2C-D3E4F");
    expect(onVerified).toHaveBeenCalledWith({
      recoveryCodeUsed: true,
      recoveryCodesRemaining: 9,
    });
  });

  it("con un codigo incorrecto muestra el error y deja reintentar", async () => {
    twoFactorVerifyRequestMock.mockResolvedValue({
      ok: false,
      message: TWO_FACTOR_CODE_INVALID,
    });
    const onChallengeLost = vi.fn();
    const typer = userEvent.setup();
    render(
      <TwoFactorVerifyForm
        onChallengeLost={onChallengeLost}
        onVerified={vi.fn()}
      />,
    );

    await typer.type(screen.getByLabelText("Código"), "000000");
    await typer.click(screen.getByRole("button", { name: /verificar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      TWO_FACTOR_CODE_INVALID,
    );
    expect(onChallengeLost).not.toHaveBeenCalled();
    // El campo se limpia para que el proximo intento no arrastre el anterior.
    expect(screen.getByLabelText("Código")).toHaveValue("");
  });

  // Con el desafio quemado reintentar no sirve: hay que volver al login.
  it("con el desafio vencido avisa al llamador en vez de mostrar el error", async () => {
    twoFactorVerifyRequestMock.mockResolvedValue({
      ok: false,
      message: TWO_FACTOR_CHALLENGE_EXPIRED,
      expired: true,
    });
    const onChallengeLost = vi.fn();
    const typer = userEvent.setup();
    render(
      <TwoFactorVerifyForm
        onChallengeLost={onChallengeLost}
        onVerified={vi.fn()}
      />,
    );

    await typer.type(screen.getByLabelText("Código"), "123456");
    await typer.click(screen.getByRole("button", { name: /verificar/i }));

    expect(onChallengeLost).toHaveBeenCalledWith(TWO_FACTOR_CHALLENGE_EXPIRED);
  });

  it("alterna entre el codigo de la app y el de recuperacion", async () => {
    const typer = userEvent.setup();
    render(
      <TwoFactorVerifyForm onChallengeLost={vi.fn()} onVerified={vi.fn()} />,
    );

    await typer.click(
      screen.getByRole("button", { name: /no tengo acceso a mi app/i }),
    );
    expect(screen.getByLabelText("Código de recuperación")).toBeInTheDocument();

    await typer.click(
      screen.getByRole("button", { name: /volver al código de la app/i }),
    );
    expect(screen.getByLabelText("Código")).toBeInTheDocument();
  });
});
