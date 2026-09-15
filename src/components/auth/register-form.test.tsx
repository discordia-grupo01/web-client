import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerRequest } from "@/features/auth/client";

import { RegisterForm } from "./register-form";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("@/features/auth/client", () => ({
  registerRequest: vi.fn(),
}));

const registerRequestMock = vi.mocked(registerRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

async function fillForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nombre de usuario"), "ada");
  await user.type(
    screen.getByLabelText("Correo electrónico"),
    "ada@example.com",
  );
  await user.type(screen.getByLabelText("Contraseña"), "Secret123");
  return user;
}

describe("<RegisterForm />", () => {
  it("muestra errores de validacion y no llama al backend con campos vacios", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/ingresa un nombre de usuario/i),
    ).toBeInTheDocument();
    expect(registerRequestMock).not.toHaveBeenCalled();
  });

  it("con datos validos: llama al backend y redirige al login con aviso", async () => {
    registerRequestMock.mockResolvedValue({ ok: true });
    render(<RegisterForm />);

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(registerRequestMock).toHaveBeenCalledWith({
        name: "ada",
        email: "ada@example.com",
        password: "Secret123",
      });
    });
    expect(replace).toHaveBeenCalledWith("/login?registered=1");
  });

  it("muestra el mensaje de error que devuelve el backend", async () => {
    registerRequestMock.mockResolvedValue({
      ok: false,
      message: "Ya existe una cuenta con ese correo electrónico.",
    });
    render(<RegisterForm />);

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /ya existe una cuenta/i,
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
