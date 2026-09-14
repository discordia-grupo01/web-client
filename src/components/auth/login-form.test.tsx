import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginRequest } from "@/features/auth/client";

import { LoginForm } from "./login-form";

const replace = vi.fn();
const refresh = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/features/auth/client", () => ({
  loginRequest: vi.fn(),
}));

const loginRequestMock = vi.mocked(loginRequest);

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
});

describe("<LoginForm />", () => {
  it("muestra errores de validacion y no llama al backend con campos vacios", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByText(/ingresa tu correo/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresa tu contrasena/i)).toBeInTheDocument();
    expect(loginRequestMock).not.toHaveBeenCalled();
  });

  it("con credenciales validas: llama al backend y redirige", async () => {
    loginRequestMock.mockResolvedValue({
      ok: true,
      user: { id: "1", name: "Ada", email: "ada@example.com", created_at: "" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "ada@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "secret123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

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
      screen.getByLabelText("Correo electrónico"),
      "ada@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "wrong");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrectos/i);
    expect(replace).not.toHaveBeenCalled();
  });

  it("muestra el aviso de cuenta creada cuando viene de registrarse", () => {
    searchParams = new URLSearchParams("registered=1");
    render(<LoginForm />);

    expect(screen.getByText(/cuenta creada con éxito/i)).toBeInTheDocument();
  });
});
