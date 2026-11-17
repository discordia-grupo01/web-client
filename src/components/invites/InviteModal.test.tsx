import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InviteModal } from "./InviteModal";

vi.mock("@/services/invites/client", () => ({
  listInvitationsRequest: () => Promise.resolve({ ok: true, invitations: [] }),
  createInviteRequest: vi.fn(),
  revokeInviteRequest: vi.fn(),
}));

const onOpenBoosts = vi.fn();

beforeEach(() => {
  onOpenBoosts.mockReset();
});

function renderModal(
  boostLevel: 0 | 1 | 2 | 3,
  vanityCode: string | null = null,
) {
  render(
    <InviteModal
      serverId="s1"
      serverName="Club de Lectura"
      vanityCode={vanityCode}
      boostLevel={boostLevel}
      boostCount={[2, 7, 18, 30][boostLevel]}
      onClose={vi.fn()}
      onOpenBoosts={onOpenBoosts}
    />,
  );
}

const lockedRow = () =>
  screen.queryByRole("region", { name: "Link propio del servidor" });

describe("InviteModal y el link propio del servidor", () => {
  it("debajo del nivel 3 muestra la fila bloqueada con lo que falta", async () => {
    renderModal(2);

    expect(lockedRow()).toBeInTheDocument();
    expect(
      screen.getByText("Faltan 12 boosts para el nivel 3"),
    ).toBeInTheDocument();
    expect(await screen.findByText(/club-de-lectura/)).toBeInTheDocument();
  });

  it("la fila bloqueada lleva a boostear y a los beneficios", async () => {
    renderModal(0);

    await userEvent.click(
      screen.getByRole("button", { name: "Boostear servidor" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Ver beneficios" }),
    );

    expect(onOpenBoosts.mock.calls).toEqual([["boost"], ["benefits"]]);
  });

  it("en el nivel 3 muestra el link guardado y no la fila bloqueada", () => {
    renderModal(3, "club-lectura");

    expect(lockedRow()).not.toBeInTheDocument();
    expect(screen.getByText("Link del servidor")).toBeInTheDocument();
  });

  it("en el nivel 3 sin link guardado no muestra ninguna de las dos", () => {
    renderModal(3);

    expect(lockedRow()).not.toBeInTheDocument();
    expect(screen.queryByText("Link del servidor")).not.toBeInTheDocument();
  });
});
