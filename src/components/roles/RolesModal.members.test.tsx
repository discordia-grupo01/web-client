import type { Member, Role } from "@discordia/client-shared";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RolesModal } from "./RolesModal";

const listRolesRequest = vi.fn();
const listRoleMembersRequest = vi.fn();
const assignRoleRequest = vi.fn();
const removeRoleRequest = vi.fn();

vi.mock("@/services/roles/client", () => ({
  listRolesRequest: (...args: unknown[]) => listRolesRequest(...args),
  listRoleMembersRequest: (...args: unknown[]) =>
    listRoleMembersRequest(...args),
  assignRoleRequest: (...args: unknown[]) => assignRoleRequest(...args),
  removeRoleRequest: (...args: unknown[]) => removeRoleRequest(...args),
  createRoleRequest: vi.fn(),
  updateRoleRequest: vi.fn(),
  deleteRoleRequest: vi.fn(),
  reorderRolesRequest: vi.fn(),
  setDefaultRoleRequest: vi.fn(),
  listMemberRolesRequest: vi.fn(),
}));

function member(id: string, name: string): Member {
  return {
    user_id: id,
    is_owner: false,
    joined_at: "2026-10-01T00:00:00Z",
    profile: {
      name,
      avatar_url: "",
      description: "",
      status_text: "",
      status_emoji: "",
    },
  } as Member;
}

vi.mock("@/services/members/useServerMembers", () => ({
  useServerMembers: () => [
    member("u1", "Ana"),
    member("u2", "Beto"),
    member("u3", "Caro"),
  ],
}));

const MOD: Role = {
  id: "r-mod",
  server_id: "s1",
  name: "Moderador",
  color: "#ff0000",
  permissions: [],
  position: 1,
  is_everyone: false,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  listRolesRequest.mockResolvedValue({ ok: true, roles: [MOD] });
  listRoleMembersRequest.mockResolvedValue({
    ok: true,
    members: [member("u2", "Beto")],
    total: 1,
  });
});

function renderModal() {
  render(
    <RolesModal
      serverId="s1"
      serverName="Prueba"
      isOwner
      myRoles={[]}
      onClose={vi.fn()}
    />,
  );
}

async function openMembersTab() {
  await screen.findAllByText("Moderador");
  await userEvent.click(screen.getByRole("button", { name: "Miembros" }));
}

describe("RolesModal: miembros por rol", () => {
  it("CA1: lista a todos los que tienen el rol y al resto aparte", async () => {
    renderModal();
    await openMembersTab();

    expect(listRoleMembersRequest).toHaveBeenCalledWith("r-mod");
    const withRole = (await screen.findByText("Con este rol (1)"))
      .parentElement!;
    expect(within(withRole).getByText("Beto")).toBeInTheDocument();
    const withoutRole = screen.getByText("Sin este rol (2)").parentElement!;
    expect(within(withoutRole).getByText("Ana")).toBeInTheDocument();
    expect(within(withoutRole).getByText("Caro")).toBeInTheDocument();
    expect(screen.getByText("1 miembro")).toBeInTheDocument();
  });

  it("asignar el rol mueve al miembro a 'Con este rol'", async () => {
    assignRoleRequest.mockResolvedValue({ ok: true, role: MOD });
    renderModal();
    await openMembersTab();
    await screen.findByText("Con este rol (1)");

    const ana = screen.getByText("Ana").closest("div")!;
    await userEvent.click(within(ana).getByRole("button", { name: /Asignar/ }));

    expect(assignRoleRequest).toHaveBeenCalledWith("s1", "u1", "r-mod");
    expect(await screen.findByText("Con este rol (2)")).toBeInTheDocument();
    expect(screen.getByText("2 miembros")).toBeInTheDocument();
  });

  it("si no puede cargar los miembros del rol, muestra el error", async () => {
    listRoleMembersRequest.mockResolvedValue({
      ok: false,
      message: "No tenés permiso para ver los miembros de los roles.",
    });
    renderModal();
    await openMembersTab();

    expect(
      await screen.findByText(/No tenés permiso para ver los miembros/),
    ).toBeInTheDocument();
  });
});
