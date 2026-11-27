import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { changePasswordRequest } from "@/services/auth/client";

import { ChangePasswordForm } from "./ChangePasswordForm";

vi.mock("@/services/auth/client", () => ({
  changePasswordRequest: vi.fn(),
}));

const changePasswordRequestMock = vi.mocked(changePasswordRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

async function fillAndSubmit(current: string, next: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/^Contraseña actual/), current);
  await user.type(screen.getByLabelText(/^Nueva contraseña/), next);
  await user.type(screen.getByLabelText(/^Confirmar contraseña/), next);
  await user.click(screen.getByRole("button", { name: "Guardar" }));
}

function renderForm() {
  const handlers = {
    onCancel: vi.fn(),
    onChanged: vi.fn(),
    onPasswordNotSet: vi.fn(),
  };
  render(<ChangePasswordForm {...handlers} />);
  return handlers;
}

describe("<ChangePasswordForm />", () => {
  it("avisa que cambió cuando el back lo acepta", async () => {
    changePasswordRequestMock.mockResolvedValue({ ok: true });
    const handlers = renderForm();

    await fillAndSubmit("Actual123", "Nueva1234");

    expect(changePasswordRequestMock).toHaveBeenCalledWith({
      currentPassword: "Actual123",
      newPassword: "Nueva1234",
      confirmPassword: "Nueva1234",
    });
    expect(handlers.onChanged).toHaveBeenCalled();
  });

  it("no llama al back si la nueva es igual a la actual", async () => {
    renderForm();

    await fillAndSubmit("Actual123", "Actual123");

    expect(
      screen.getByText(
        "La nueva contraseña tiene que ser distinta de la actual",
      ),
    ).toBeInTheDocument();
    expect(changePasswordRequestMock).not.toHaveBeenCalled();
  });

  it("muestra el error del back y se queda en el formulario", async () => {
    changePasswordRequestMock.mockResolvedValue({
      ok: false,
      message: "La contraseña actual es incorrecta.",
    });
    const handlers = renderForm();

    await fillAndSubmit("Mal12345", "Nueva1234");

    expect(
      await screen.findByText("La contraseña actual es incorrecta."),
    ).toBeInTheDocument();
    expect(handlers.onChanged).not.toHaveBeenCalled();
  });

  it("pasa a definir contraseña si la cuenta no tiene una", async () => {
    changePasswordRequestMock.mockResolvedValue({
      ok: false,
      message: "Tu cuenta todavía no tiene una contraseña.",
      passwordNotSet: true,
    });
    const handlers = renderForm();

    await fillAndSubmit("Actual123", "Nueva1234");

    expect(handlers.onPasswordNotSet).toHaveBeenCalled();
  });
});
