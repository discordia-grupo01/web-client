import { TWO_FACTOR_CHALLENGE_EXPIRED } from "@discordia/client-shared";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginRequest } from "@/services/auth/client";
import { twoFactorVerifyRequest } from "@/services/two-factor/client";

import { LoginForm } from "./login-form";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/services/auth/client", () => ({
  loginRequest: vi.fn(),
}));

vi.mock("@/services/two-factor/client", () => ({
  twoFactorVerifyRequest: vi.fn(),
}));

const loginRequestMock = vi.mocked(loginRequest);
const twoFactorVerifyRequestMock = vi.mocked(twoFactorVerifyRequest);

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

  it("redirige a confirmar el correo cuando la cuenta ya existe pero no está verificada", async () => {
    loginRequestMock.mockResolvedValue({
      ok: false,
      message:
        "Tu cuenta ya está registrada, pero debes confirmar tu correo electrónico antes de iniciar sesión.",
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "ada@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "Secure123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(window.location.href).toBe(
        "/confirm-email?email=ada%40example.com&from=login",
      );
    });
  });

  it("muestra el aviso de cuenta creada cuando viene de registrarse", () => {
    searchParams = new URLSearchParams("registered=1");
    render(<LoginForm />);

    expect(screen.getByText(/cuenta creada con éxito/i)).toBeInTheDocument();
  });

  // CA2: con 2FA activo la contraseña correcta no entra a ningún lado; la
  // pantalla pasa al paso del código.
  it("con 2FA activo pasa al paso del codigo en vez de redirigir", async () => {
    loginRequestMock.mockResolvedValue({ ok: true, twoFactorRequired: true });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "ada@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "Secure123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByLabelText("Código")).toBeInTheDocument();
    expect(window.location.href).toBe("");
  });

  it("vuelve al paso de la contrasena cuando el desafio se vence", async () => {
    loginRequestMock.mockResolvedValue({ ok: true, twoFactorRequired: true });
    twoFactorVerifyRequestMock.mockResolvedValue({
      ok: false,
      message: TWO_FACTOR_CHALLENGE_EXPIRED,
      expired: true,
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "ada@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "Secure123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await user.type(await screen.findByLabelText("Código"), "123456");
    await user.click(screen.getByRole("button", { name: /verificar/i }));

    expect(await screen.findByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      TWO_FACTOR_CHALLENGE_EXPIRED,
    );
  });

  // CA4: entrar con un código de recuperación arrastra el aviso de regenerar
  // la lista hasta la pantalla siguiente.
  it("tras usar un codigo de recuperacion redirige con el aviso de regenerar", async () => {
    loginRequestMock.mockResolvedValue({ ok: true, twoFactorRequired: true });
    twoFactorVerifyRequestMock.mockResolvedValue({
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
      recoveryCodeUsed: true,
      recoveryCodesRemaining: 9,
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "ada@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "Secure123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await user.type(await screen.findByLabelText("Código"), "123456");
    await user.click(screen.getByRole("button", { name: /verificar/i }));

    await waitFor(() => {
      expect(window.location.href).toContain("/home?notice=");
    });
    expect(decodeURIComponent(window.location.href)).toContain(
      "código de recuperación",
    );
  });
});
