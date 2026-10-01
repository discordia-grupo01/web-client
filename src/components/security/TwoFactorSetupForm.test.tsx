import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setPasswordRequest } from "@/services/auth/client";
import {
  twoFactorActivateRequest,
  twoFactorSetupRequest,
} from "@/services/two-factor/client";

import { TwoFactorSetupForm } from "./TwoFactorSetupForm";

vi.mock("@/services/two-factor/client", () => ({
  twoFactorSetupRequest: vi.fn(),
  twoFactorActivateRequest: vi.fn(),
}));

vi.mock("@/services/auth/client", () => ({
  setPasswordRequest: vi.fn(),
}));

const twoFactorSetupRequestMock = vi.mocked(twoFactorSetupRequest);
const twoFactorActivateRequestMock = vi.mocked(twoFactorActivateRequest);
const setPasswordRequestMock = vi.mocked(setPasswordRequest);

const SETUP = {
  secret: "JBSWY3DPEHPK3PXP",
  otpauth_url:
    "otpauth://totp/Discordia:ada@example.com?secret=JBSWY3DPEHPK3PXP",
  issuer: "Discordia",
  account: "ada@example.com",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<TwoFactorSetupForm />", () => {
  it("muestra el QR directamente cuando la cuenta ya tiene contraseña", async () => {
    twoFactorSetupRequestMock.mockResolvedValue({ ok: true, setup: SETUP });

    render(<TwoFactorSetupForm onCancel={vi.fn()} onActivated={vi.fn()} />);

    expect(
      await screen.findByText(/conectá tu app autenticadora/i),
    ).toBeInTheDocument();
    expect(setPasswordRequestMock).not.toHaveBeenCalled();
  });

  // Una cuenta federada por Google sin contraseña propia no puede llegar
  // directo al QR: primero tiene que configurar una.
  it("pide configurar una contraseña antes del QR para una cuenta federada", async () => {
    twoFactorSetupRequestMock.mockResolvedValueOnce({
      ok: false,
      message: "Tu cuenta no tiene una contraseña propia todavía.",
      passwordRequired: true,
    });
    twoFactorSetupRequestMock.mockResolvedValueOnce({ ok: true, setup: SETUP });
    setPasswordRequestMock.mockResolvedValue({ ok: true });

    const user = userEvent.setup();
    render(<TwoFactorSetupForm onCancel={vi.fn()} onActivated={vi.fn()} />);

    expect(
      await screen.findByText(/creá una contraseña primero/i),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nueva contraseña"), "Secure123");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Secure123");
    await user.click(
      screen.getByRole("button", { name: /guardar y continuar/i }),
    );

    await waitFor(() => {
      expect(setPasswordRequestMock).toHaveBeenCalledWith({
        password: "Secure123",
        confirmPassword: "Secure123",
      });
    });
    expect(
      await screen.findByText(/conectá tu app autenticadora/i),
    ).toBeInTheDocument();
    expect(twoFactorSetupRequestMock).toHaveBeenCalledTimes(2);
  });

  it("ofrece continuar al QR si la contraseña ya se configuró en otra pestaña", async () => {
    twoFactorSetupRequestMock.mockResolvedValueOnce({
      ok: false,
      message: "Tu cuenta no tiene una contraseña propia todavía.",
      passwordRequired: true,
    });
    twoFactorSetupRequestMock.mockResolvedValueOnce({ ok: true, setup: SETUP });
    setPasswordRequestMock.mockResolvedValue({
      ok: false,
      message: "Tu cuenta ya tiene una contraseña configurada.",
      alreadySet: true,
    });

    const user = userEvent.setup();
    render(<TwoFactorSetupForm onCancel={vi.fn()} onActivated={vi.fn()} />);

    await user.type(
      await screen.findByLabelText("Nueva contraseña"),
      "Secure123",
    );
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Secure123");
    await user.click(
      screen.getByRole("button", { name: /guardar y continuar/i }),
    );

    const continueButton = await screen.findByRole("button", {
      name: /continuar al qr/i,
    });
    await user.click(continueButton);

    expect(
      await screen.findByText(/conectá tu app autenticadora/i),
    ).toBeInTheDocument();
  });

  it("activa el 2FA con el código confirmado", async () => {
    twoFactorSetupRequestMock.mockResolvedValue({ ok: true, setup: SETUP });
    twoFactorActivateRequestMock.mockResolvedValue({
      ok: true,
      recoveryCodes: ["NOVA-1234"],
    });
    const onActivated = vi.fn();

    const user = userEvent.setup();
    render(<TwoFactorSetupForm onCancel={vi.fn()} onActivated={onActivated} />);

    await user.type(await screen.findByLabelText("Código de tu app"), "123456");
    await user.click(
      screen.getByRole("button", { name: /confirmar y activar/i }),
    );

    await waitFor(() => {
      expect(onActivated).toHaveBeenCalledWith(["NOVA-1234"]);
    });
  });
});
