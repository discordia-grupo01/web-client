import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginRequest } from "@/services/auth/client";

import { LoginForm } from "./login-form";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/services/auth/client", () => ({
  loginRequest: vi.fn(),
}));

const loginRequestMock = vi.mocked(loginRequest);

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
  // LoginForm hace una navegacion dura tras un login exitoso (ver el
  // comentario en login-form.tsx); jsdom no implementa la navegacion real, asi
  // que reemplazamos `location` por un objeto simple para poder espiar `href`.
  Object.defineProperty(window, "location", {
    value: { href: "" },
    writable: true,
  });
});

describe("<LoginForm />", () => {
  it("muestra errores de validacion y no llama al backend con campos vacios", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByText(/ingresá tu correo/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresá tu contraseña/i)).toBeInTheDocument();
    expect(loginRequestMock).not.toHaveBeenCalled();
  });

  it("con credenciales validas: llama al backend y redirige", async () => {
    loginRequestMock.mockResolvedValue({
      ok: true,
      user: {
        id: "1",
        name: "Ada",
        email: "ada@example.com",
        description: "",
        avatar_url: "",
        status_text: "",
        status_emoji: "",
        created_at: "",
      },
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
    expect(window.location.href).toBe("/home");
  });

  it("muestra el mensaje de error que devuelve el backend", async () => {
    loginRequestMock.mockResolvedValue({
      ok: false,
      message: "El correo electrónico o la contraseña son incorrectos.",
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
    expect(window.location.href).toBe("");
  });

  it("muestra el aviso de cuenta creada cuando viene de registrarse", () => {
    searchParams = new URLSearchParams("registered=1");
    render(<LoginForm />);

    expect(screen.getByText(/cuenta creada con éxito/i)).toBeInTheDocument();
  });
});
