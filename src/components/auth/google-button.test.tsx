import { TWO_FACTOR_CHALLENGE_EXPIRED } from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { oauthGoogleLoginRequest } from "@/services/auth/client";
import { twoFactorVerifyRequest } from "@/services/two-factor/client";

import { GoogleButton } from "./google-button";

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({
    onSuccess,
  }: {
    onSuccess: (response: { credential: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onSuccess({ credential: "google-id-token" })}
    >
      Google login stub
    </button>
  ),
}));

vi.mock("@/services/auth/client", () => ({
  oauthGoogleLoginRequest: vi.fn(),
}));

vi.mock("@/services/two-factor/client", () => ({
  twoFactorVerifyRequest: vi.fn(),
}));

const oauthGoogleLoginRequestMock = vi.mocked(oauthGoogleLoginRequest);
const twoFactorVerifyRequestMock = vi.mocked(twoFactorVerifyRequest);

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "location", {
    value: { href: "" },
    writable: true,
  });
  // jsdom no implementa ResizeObserver; GoogleButton lo usa para escalar el
  // iframe invisible de Google sobre el boton visual.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe("<GoogleButton />", () => {
  it("con login exitoso redirige a home", async () => {
    oauthGoogleLoginRequestMock.mockResolvedValue({
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
    render(<GoogleButton />);

    await user.click(screen.getByText("Google login stub"));

    expect(oauthGoogleLoginRequestMock).toHaveBeenCalledWith("google-id-token");
    expect(window.location.href).toBe("/home");
  });

  // Una cuenta con 2FA activo no puede quedar logueada solo por vincularse
  // via Google: el segundo paso hay que completarlo igual que en el login
  // con email y contraseña.
  it("con 2FA activo pasa al paso del codigo en vez de redirigir", async () => {
    oauthGoogleLoginRequestMock.mockResolvedValue({
      ok: true,
      twoFactorRequired: true,
      expiresIn: 300,
    });
    const user = userEvent.setup();
    render(<GoogleButton />);

    await user.click(screen.getByText("Google login stub"));

    expect(
      await screen.findByLabelText("Código de seguridad"),
    ).toBeInTheDocument();
    expect(window.location.href).toBe("");
  });

  it("vuelve al boton de Google cuando el desafio se vence", async () => {
    oauthGoogleLoginRequestMock.mockResolvedValue({
      ok: true,
      twoFactorRequired: true,
      expiresIn: 300,
    });
    twoFactorVerifyRequestMock.mockResolvedValue({
      ok: false,
      message: TWO_FACTOR_CHALLENGE_EXPIRED,
      expired: true,
    });
    const user = userEvent.setup();
    render(<GoogleButton />);

    await user.click(screen.getByText("Google login stub"));

    await user.type(
      await screen.findByLabelText("Código de seguridad"),
      "123456",
    );
    await user.click(screen.getByRole("button", { name: /verificar/i }));

    expect(await screen.findByText("Google login stub")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      TWO_FACTOR_CHALLENGE_EXPIRED,
    );
  });

  it("muestra el mensaje de error que devuelve el backend", async () => {
    oauthGoogleLoginRequestMock.mockResolvedValue({
      ok: false,
      message: "No pudimos validar tu identidad con Google.",
    });
    const user = userEvent.setup();
    render(<GoogleButton />);

    await user.click(screen.getByText("Google login stub"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /no pudimos validar/i,
    );
    expect(window.location.href).toBe("");
  });
});
