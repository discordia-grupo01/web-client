import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BanMemberModal } from "./BanMemberModal";

const banMemberRequest = vi.fn();

vi.mock("@/services/bans/client", () => ({
  banMemberRequest: (...args: unknown[]) => banMemberRequest(...args),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

function renderModal(onBanned = vi.fn()) {
  render(
    <BanMemberModal
      serverId="s1"
      userId="u9"
      name="Nova"
      avatarSrc={null}
      onClose={vi.fn()}
      onBanned={onBanned}
    />,
  );
  return { onBanned };
}

describe("BanMemberModal", () => {
  it("banea con el motivo y confirma el resultado", async () => {
    banMemberRequest.mockResolvedValue({ ok: true, ban: {} });
    const { onBanned } = renderModal();

    await userEvent.type(screen.getByLabelText(/Motivo del baneo/), "Spam");
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar baneo" }),
    );

    expect(banMemberRequest).toHaveBeenCalledWith("s1", {
      userId: "u9",
      reason: "Spam",
    });
    expect(await screen.findByText(/Nova fue baneado/)).toBeInTheDocument();
    expect(onBanned).toHaveBeenCalledOnce();
  });

  it("el motivo es opcional", async () => {
    banMemberRequest.mockResolvedValue({ ok: true, ban: {} });
    renderModal();

    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar baneo" }),
    );

    expect(banMemberRequest).toHaveBeenCalledWith("s1", {
      userId: "u9",
      reason: "",
    });
  });

  it("no deja enviar un motivo de mas de 512 caracteres", async () => {
    renderModal();

    await userEvent.click(screen.getByLabelText(/Motivo del baneo/));
    await userEvent.paste("a".repeat(513));

    expect(
      screen.getByRole("button", { name: "Confirmar baneo" }),
    ).toBeDisabled();
    expect(
      screen.getByText("El motivo no puede superar los 512 caracteres."),
    ).toBeInTheDocument();
  });

  it("muestra el rechazo del back por jerarquia o permisos", async () => {
    banMemberRequest.mockResolvedValue({
      ok: false,
      message: "No podés banear a alguien con un rol igual o superior al tuyo.",
    });
    const { onBanned } = renderModal();

    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar baneo" }),
    );

    expect(
      await screen.findByText(/rol igual o superior al tuyo/),
    ).toBeInTheDocument();
    expect(onBanned).not.toHaveBeenCalled();
  });
});
