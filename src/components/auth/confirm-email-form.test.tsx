import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";

import {
  confirmEmailRequest,
  requestEmailConfirmationRequest,
} from "@/services/auth/client";

import { ConfirmEmailForm } from "./confirm-email-form";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/services/auth/client", () => ({
  confirmEmailRequest: vi.fn(),
  requestEmailConfirmationRequest: vi.fn(),
}));

const confirmEmailRequestMock = vi.mocked(confirmEmailRequest);
const requestEmailConfirmationRequestMock = vi.mocked(
  requestEmailConfirmationRequest,
);

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
});

describe("<ConfirmEmailForm />", () => {
  it("confirma un token válido", async () => {
    searchParams = new URLSearchParams("token=valid-token");
    confirmEmailRequestMock.mockResolvedValue({ ok: true });

    render(
      <StrictMode>
        <ConfirmEmailForm />
      </StrictMode>,
    );

    expect(await screen.findByText(/correo confirmado/i)).toBeInTheDocument();
    expect(confirmEmailRequestMock).toHaveBeenCalledWith("valid-token");
    expect(confirmEmailRequestMock).toHaveBeenCalledTimes(1);
  });

  it("no permite reenviar desde un enlace vencido", async () => {
    searchParams = new URLSearchParams("token=expired-token");
    confirmEmailRequestMock.mockResolvedValue({
      ok: false,
      message: "El enlace de confirmación no es válido o expiró.",
    });
    render(<ConfirmEmailForm />);

    expect(await screen.findByText(/el enlace expiró/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reenviar confirmación/i }),
    ).not.toBeInTheDocument();
    expect(requestEmailConfirmationRequestMock).not.toHaveBeenCalled();
  });

  it("muestra el aviso de envío después del registro", () => {
    searchParams = new URLSearchParams("sent=1");

    render(<ConfirmEmailForm />);

    expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /volver al inicio de sesión/i }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.queryByRole("button", { name: /reenviar confirmación/i }),
    ).not.toBeInTheDocument();
  });

  it("permite reenviar solo después de un login no verificado", async () => {
    searchParams = new URLSearchParams("from=login&email=ada%40example.com");
    requestEmailConfirmationRequestMock.mockResolvedValue({ ok: true });

    render(<ConfirmEmailForm />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /reenviar confirmación/i }),
    );

    await waitFor(() => {
      expect(requestEmailConfirmationRequestMock).toHaveBeenCalledWith(
        "ada@example.com",
      );
    });
  });
});
