import type { Member, Role } from "@discordia/client-shared";
import { render, screen, waitFor, within } from "@testing-library/react";
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

const SERVER_MEMBERS = [
  member("u1", "Ana"),
  member("u2", "Beto"),
  member("u3", "Caro"),
];

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

/** Quienes tienen el rol; asignar y quitar lo cambian, como en el back. */
let holders: Set<string>;

beforeEach(() => {
  vi.resetAllMocks();
  holders = new Set(["u2"]);
  listRolesRequest.mockResolvedValue({ ok: true, roles: [MOD] });
  listRoleMembersRequest.mockImplementation(
    async (
      _roleId: string,
      query: { search?: string; hasRole?: boolean; limit?: number } = {},
    ) => {
      const wantsHolders = query.hasRole !== false;
      const needle = query.search?.trim().toLowerCase() ?? "";
      const found = SERVER_MEMBERS.filter(
        (m) =>
          holders.has(m.user_id) === wantsHolders &&
          m.profile!.name.toLowerCase().includes(needle),
      );
      return {
        ok: true,
        members: found.slice(0, query.limit ?? found.length),
        total: found.length,
      };
    },
  );
  assignRoleRequest.mockImplementation(async (_s, userId: string) => {
    holders.add(userId);
    return { ok: true, role: MOD };
  });
  removeRoleRequest.mockImplementation(async (_s, userId: string) => {
    holders.delete(userId);
    return { ok: true };
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
  it("CA1: separa en pestañas a quienes tienen el rol y a quienes no", async () => {
    renderModal();
    await openMembersTab();

    expect(
      await screen.findByRole("tab", { name: "Con este rol (1)" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("tab", { name: "Sin este rol (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Beto")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.getByText("1 miembro")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("tab", { name: "Sin este rol (2)" }),
    );

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Caro")).toBeInTheDocument();
    expect(listRoleMembersRequest).toHaveBeenCalledWith("r-mod", {
      search: "",
      limit: 15,
      offset: 0,
      hasRole: false,
    });
  });

  it("asignar el rol desde 'Sin este rol' lo pasa a 'Con este rol'", async () => {
    renderModal();
    await openMembersTab();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Sin este rol (2)" }),
    );

    const ana = (await screen.findByText("Ana")).closest("div")!;
    await userEvent.click(within(ana).getByRole("button", { name: /Asignar/ }));

    expect(assignRoleRequest).toHaveBeenCalledWith("s1", "u1", "r-mod");
    expect(
      await screen.findByRole("tab", { name: "Con este rol (2)" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("tab", { name: "Sin este rol (1)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 miembros")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Ana")).not.toBeInTheDocument(),
    );
  });

  it("busca por nombre en el back para asignar rapido", async () => {
    renderModal();
    await openMembersTab();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Sin este rol (2)" }),
    );
    await screen.findByText("Ana");

    await userEvent.type(screen.getByRole("searchbox"), "car");

    await waitFor(() =>
      expect(screen.queryByText("Ana")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Caro")).toBeInTheDocument();
    expect(listRoleMembersRequest).toHaveBeenCalledWith("r-mod", {
      search: "car",
      limit: 15,
      offset: 0,
      hasRole: false,
    });
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
