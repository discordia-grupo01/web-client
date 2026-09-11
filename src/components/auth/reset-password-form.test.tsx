import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetPasswordRequest } from "@/features/auth/client";

import { ResetPasswordForm } from "./reset-password-form";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/features/auth/client", () => ({
  resetPasswordRequest: vi.fn(),
}));

const resetPasswordRequestMock = vi.mocked(resetPasswordRequest);

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
});

describe("<ResetPasswordForm />", () => {
  it("sin token en la URL: muestra que el enlace es invalido y no renderiza el form", () => {
    render(<ResetPasswordForm />);

    expect(screen.getByText(/enlace invalido/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nueva contrasena")).not.toBeInTheDocument();
  });

  it("muestra errores de validacion y no llama al backend con contrasenas invalidas", async () => {
    searchParams = new URLSearchParams({ token: "abc123" });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Nueva contrasena"), "corta");
    await user.type(screen.getByLabelText("Confirmar contrasena"), "otra");
    await user.click(
      screen.getByRole("button", { name: /actualizar contrasena/i }),
    );

    expect(
      await screen.findByText(/mayuscula, una minuscula y un numero/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/las contrasenas no coinciden/i),
    ).toBeInTheDocument();
    expect(resetPasswordRequestMock).not.toHaveBeenCalled();
  });

  it("con datos validos: llama al backend con el token y redirige al login", async () => {
    searchParams = new URLSearchParams({ token: "abc123" });
    resetPasswordRequestMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Nueva contrasena"), "Secret123");
    await user.type(screen.getByLabelText("Confirmar contrasena"), "Secret123");
    await user.click(
      screen.getByRole("button", { name: /actualizar contrasena/i }),
    );

    expect(resetPasswordRequestMock).toHaveBeenCalledWith({
      token: "abc123",
      newPassword: "Secret123",
      confirmPassword: "Secret123",
    });
    expect(replace).toHaveBeenCalledWith("/login?reset=success");
  });

  it("muestra el mensaje de error que devuelve el backend (ej: token invalido)", async () => {
    searchParams = new URLSearchParams({ token: "expirado" });
    resetPasswordRequestMock.mockResolvedValue({
      ok: false,
      message: "El enlace de recuperacion no es valido o expiro.",
    });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Nueva contrasena"), "Secret123");
    await user.type(screen.getByLabelText("Confirmar contrasena"), "Secret123");
    await user.click(
      screen.getByRole("button", { name: /actualizar contrasena/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/expiro/i);
    expect(replace).not.toHaveBeenCalled();
  });
});
