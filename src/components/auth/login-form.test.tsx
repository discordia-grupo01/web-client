import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginRequest } from "@/features/auth/client";

import { LoginForm } from "./login-form";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth/client", () => ({
  loginRequest: vi.fn(),
}));

const loginRequestMock = vi.mocked(loginRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<LoginForm />", () => {
  it("muestra errores de validacion y no llama al backend con campos vacios", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /iniciar sesion/i }));

    expect(await screen.findByText(/ingresa tu correo/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresa tu contrasena/i)).toBeInTheDocument();
    expect(loginRequestMock).not.toHaveBeenCalled();
  });

  it("con credenciales validas: llama al backend y redirige", async () => {
    loginRequestMock.mockResolvedValue({
      ok: true,
      user: { id: 1, name: "Ada", email: "ada@example.com", created_at: "" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("Correo electronico"),
      "ada@example.com",
    );
    await user.type(screen.getByLabelText("Contrasena"), "secret123");
    await user.click(screen.getByRole("button", { name: /iniciar sesion/i }));

    await waitFor(() => {
      expect(loginRequestMock).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "secret123",
      });
    });
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("muestra el mensaje de error que devuelve el backend", async () => {
    loginRequestMock.mockResolvedValue({
      ok: false,
      message: "El correo electronico o la contrasena son incorrectos.",
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("Correo electronico"),
      "ada@example.com",
    );
    await user.type(screen.getByLabelText("Contrasena"), "wrong");
    await user.click(screen.getByRole("button", { name: /iniciar sesion/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrectos/i);
    expect(replace).not.toHaveBeenCalled();
  });
});
