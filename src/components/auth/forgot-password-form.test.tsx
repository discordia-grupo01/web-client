import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forgotPasswordRequest } from "@/features/auth/client";

import { ForgotPasswordForm } from "./forgot-password-form";

vi.mock("@/features/auth/client", () => ({
  forgotPasswordRequest: vi.fn(),
}));

const forgotPasswordRequestMock = vi.mocked(forgotPasswordRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<ForgotPasswordForm />", () => {
  it("muestra error de validacion y no llama al backend con email vacio", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.click(screen.getByRole("button", { name: /enviar enlace/i }));

    expect(
      await screen.findByText("Ingresa tu correo electronico"),
    ).toBeInTheDocument();
    expect(forgotPasswordRequestMock).not.toHaveBeenCalled();
  });

  it("con email valido: llama al backend y muestra la confirmacion", async () => {
    forgotPasswordRequestMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByLabelText("Correo electronico"),
      "ada@example.com",
    );
    await user.click(screen.getByRole("button", { name: /enviar enlace/i }));

    expect(await screen.findByText(/revisa tu correo/i)).toBeInTheDocument();
    expect(forgotPasswordRequestMock).toHaveBeenCalledWith({
      email: "ada@example.com",
    });
  });

  it("muestra el mensaje de error que devuelve el backend (ej: rate limit)", async () => {
    forgotPasswordRequestMock.mockResolvedValue({
      ok: false,
      message:
        "Alcanzaste el limite de solicitudes. Intenta de nuevo mas tarde.",
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByLabelText("Correo electronico"),
      "ada@example.com",
    );
    await user.click(screen.getByRole("button", { name: /enviar enlace/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /limite de solicitudes/i,
    );
  });
});
