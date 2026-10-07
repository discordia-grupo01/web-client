import {
  BLOCK_USER_CONFIRM_ACTION,
  UNBLOCK_USER_CONFIRM_ACTION,
} from "@discordia/client-shared";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BlockUserModal } from "./BlockUserModal";

function renderModal(
  props: Partial<Parameters<typeof BlockUserModal>[0]> = {},
) {
  const onConfirm = vi.fn().mockResolvedValue({ ok: true });
  const onClose = vi.fn();
  render(
    <BlockUserModal
      userName="Ana"
      isBlocked={false}
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
  );
  return { onConfirm, onClose };
}

describe("BlockUserModal", () => {
  it("no bloquea hasta que se confirma", () => {
    const { onConfirm } = renderModal();

    expect(screen.getByText("¿Bloquear a Ana?")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("al confirmar bloquea y cierra", async () => {
    const { onConfirm, onClose } = renderModal();

    await userEvent.click(
      screen.getByRole("button", { name: BLOCK_USER_CONFIRM_ACTION }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("si ya esta bloqueado confirma el desbloqueo", async () => {
    const { onConfirm } = renderModal({ isBlocked: true });

    expect(screen.getByText("¿Desbloquear a Ana?")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: UNBLOCK_USER_CONFIRM_ACTION }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("si falla muestra el error y no cierra", async () => {
    const onConfirm = vi
      .fn()
      .mockResolvedValue({ ok: false, message: "Este usuario no existe." });
    const { onClose } = renderModal({ onConfirm });

    await userEvent.click(
      screen.getByRole("button", { name: BLOCK_USER_CONFIRM_ACTION }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Este usuario no existe.",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("cancelar cierra sin bloquear", async () => {
    const { onConfirm, onClose } = renderModal();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
