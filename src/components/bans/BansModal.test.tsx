import {
  type Ban,
  matchesSearch,
  type MemberPageQuery,
} from "@discordia/client-shared";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BansModal } from "./BansModal";

const listBansRequest = vi.fn();
const unbanMemberRequest = vi.fn();
const listMembersRequest = vi.fn();
const getPublicProfileRequest = vi.fn();

vi.mock("@/services/bans/client", () => ({
  listBansRequest: (...args: unknown[]) => listBansRequest(...args),
  unbanMemberRequest: (...args: unknown[]) => unbanMemberRequest(...args),
}));
vi.mock("@/services/profile/client", () => ({
  getPublicProfileRequest: (...args: unknown[]) =>
    getPublicProfileRequest(...args),
}));
vi.mock("@/services/members/client", () => ({
  listMembersRequest: (...args: unknown[]) => listMembersRequest(...args),
}));

function profileOf(userId: string) {
  return {
    name: nameOf(userId),
    avatar_url: "",
    description: "",
    status_text: "",
    status_emoji: "",
  };
}

function makeBans(count: number): Ban[] {
  return Array.from({ length: count }, (_, index) => ({
    server_id: "s1",
    user_id: `u${index + 1}`,
    reason: index === 0 ? "Spam" : null,
    banned_by: "owner",
    banned_at: "2026-01-01T00:00:00Z",
    profile: profileOf(`u${index + 1}`),
  }));
}

function nameOf(userId: string): string {
  return userId === "u3" ? "Andrés" : `Usuario ${userId.slice(1)}`;
}

beforeEach(() => {
  vi.resetAllMocks();
});

function renderBansModal(overrides: { onOpenProfile?: () => void } = {}) {
  const onClose = vi.fn();
  const onOpenProfile = overrides.onOpenProfile ?? vi.fn();
  const onBanMember = vi.fn();
  render(
    <BansModal
      serverId="s1"
      ownerId="owner"
      currentUserId="me"
      onOpenProfile={onOpenProfile}
      onBanMember={onBanMember}
      onClose={onClose}
    />,
  );
  return { onClose, onOpenProfile, onBanMember };
}

/** Hace de back: filtra por nombre y pagina con `q`, `limit` y `offset`. */
function serveBans(bans: Ban[]) {
  listBansRequest.mockImplementation(
    async (_serverId: string, query: MemberPageQuery = {}) => {
      const matches = bans.filter((ban) =>
        matchesSearch(ban.profile?.name ?? "", query.search ?? ""),
      );
      const offset = query.offset ?? 0;
      return {
        ok: true,
        bans: matches.slice(offset, offset + (query.limit ?? 20)),
        total: matches.length,
      };
    },
  );
  unbanMemberRequest.mockImplementation(
    async (_serverId: string, userId: string) => {
      bans.splice(
        bans.findIndex((ban) => ban.user_id === userId),
        1,
      );
      return { ok: true };
    },
  );
}

async function renderModal(count: number) {
  serveBans(makeBans(count));
  const handlers = renderBansModal();
  await screen.findByText("Usuario 1");
  return handlers;
}

describe("BansModal", () => {
  it("pagina la lista de a 10 y navega con Siguiente", async () => {
    await renderModal(45);

    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(
      screen.getByText("Mostrando 1–10 de 45 baneados"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("Usuario 11")).toBeInTheDocument();
    expect(
      screen.getByText("Mostrando 11–20 de 45 baneados"),
    ).toBeInTheDocument();
    expect(listBansRequest).toHaveBeenLastCalledWith(
      "s1",
      expect.objectContaining({ limit: 10, offset: 10 }),
    );
    expect(screen.queryByText("Usuario 1")).toBeNull();
  });

  it("muestra el motivo o 'Sin motivo indicado'", async () => {
    await renderModal(2);

    expect(screen.getByText("Spam")).toBeInTheDocument();
    expect(screen.getByText("Sin motivo indicado")).toBeInTheDocument();
  });

  it("filtra por nombre de usuario ignorando tildes y vuelve a la primera pagina", async () => {
    await renderModal(45);
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await userEvent.type(
      screen.getByRole("searchbox", {
        name: "Buscar baneados por nombre de usuario",
      }),
      "andres",
    );

    expect(await screen.findByText("Andrés")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(1),
    );
    expect(listBansRequest).toHaveBeenLastCalledWith(
      "s1",
      expect.objectContaining({ search: "andres", offset: 0 }),
    );
    expect(screen.getByText("1 resultado de 45 baneados")).toBeInTheDocument();
  });

  it("avisa cuando la busqueda no encuentra a nadie", async () => {
    await renderModal(3);

    await userEvent.type(screen.getByRole("searchbox"), "zzz");

    expect(
      await screen.findByText("No hay baneados que coincidan con la búsqueda."),
    ).toBeInTheDocument();
  });

  it("revoca un baneo: lo saca de la lista y lo confirma", async () => {
    await renderModal(3);

    const row = screen.getByText("Usuario 2").closest("li") as HTMLElement;
    await userEvent.click(within(row).getByRole("button", { name: "Revocar" }));

    expect(unbanMemberRequest).toHaveBeenCalledWith("s1", "u2");
    await waitFor(() => expect(screen.queryByText("Usuario 2")).toBeNull());
    expect(
      screen.getByText(/Se revocó el baneo de Usuario 2/),
    ).toBeInTheDocument();
  });

  it("al revocar al ultimo de una pagina vuelve a la anterior", async () => {
    await renderModal(11);
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    const row = (await screen.findByText("Usuario 11")).closest(
      "li",
    ) as HTMLElement;

    await userEvent.click(within(row).getByRole("button", { name: "Revocar" }));

    expect(await screen.findByText("Usuario 1")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(screen.queryByText("Usuario 11")).toBeNull();
  });

  it("si el back rechaza la revocacion, muestra el error y deja el baneo", async () => {
    await renderModal(2);
    unbanMemberRequest.mockResolvedValue({
      ok: false,
      message: "No tenés permiso para revocar baneos.",
    });

    const row = screen.getByText("Usuario 2").closest("li") as HTMLElement;
    await userEvent.click(within(row).getByRole("button", { name: "Revocar" }));

    expect(
      await screen.findByText("No tenés permiso para revocar baneos."),
    ).toBeInTheDocument();
    expect(screen.getByText("Usuario 2")).toBeInTheDocument();
  });

  it("sin baneados muestra el estado vacio y no hay paginacion", async () => {
    listBansRequest.mockResolvedValue({ ok: true, bans: [], total: 0 });
    renderBansModal();

    expect(
      await screen.findByText("No hay usuarios baneados."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Paginación" })).toBeNull();
  });

  it("muestra el error si no puede cargar la lista", async () => {
    listBansRequest.mockResolvedValue({
      ok: false,
      message: "No tenés permiso para banear miembros.",
    });
    renderBansModal();

    expect(
      await screen.findByText("No tenés permiso para banear miembros."),
    ).toBeInTheDocument();
  });

  describe("pestaña Banear miembro", () => {
    const members = [
      { user_id: "owner", is_owner: true, joined_at: "" },
      { user_id: "me", is_owner: false, joined_at: "" },
      {
        user_id: "u5",
        is_owner: false,
        joined_at: "",
        profile: profileOf("u5"),
      },
      {
        user_id: "u6",
        is_owner: false,
        joined_at: "",
        profile: profileOf("u6"),
      },
    ];

    async function openMembersTab() {
      listBansRequest.mockResolvedValue({ ok: true, bans: [], total: 0 });
      getPublicProfileRequest.mockResolvedValue({ ok: false, message: "" });
      // Como el back: filtra por nombre lo que llega en `search`.
      listMembersRequest.mockImplementation(
        async (_serverId: string, query: { search?: string } = {}) => {
          const needle = query.search?.trim().toLowerCase() ?? "";
          const found = members.filter((member) =>
            (member.profile?.name ?? "").toLowerCase().includes(needle),
          );
          return { ok: true, members: found, total: found.length };
        },
      );
      const handlers = renderBansModal();
      await userEvent.click(
        screen.getByRole("tab", { name: "Banear miembro" }),
      );
      await screen.findByText("Usuario 5");
      return handlers;
    }

    it("lista los miembros sin el propietario ni uno mismo", async () => {
      await openMembersTab();

      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByText("Usuario 6")).toBeInTheDocument();
    });

    it("no pide los miembros hasta abrir la pestaña", async () => {
      listBansRequest.mockResolvedValue({ ok: true, bans: [], total: 0 });
      renderBansModal();
      await screen.findByText("No hay usuarios baneados.");

      expect(listMembersRequest).not.toHaveBeenCalled();
    });

    it("Ver perfil abre el perfil de ese miembro sin cerrar el modal", async () => {
      const { onClose, onOpenProfile } = await openMembersTab();

      const row = screen.getByText("Usuario 6").closest("li") as HTMLElement;
      await userEvent.click(
        within(row).getByRole("button", { name: "Ver perfil" }),
      );

      expect(onClose).not.toHaveBeenCalled();
      expect(onOpenProfile).toHaveBeenCalledWith("u6");
    });

    it("Banear abre la confirmacion de ese miembro sin pasar por su perfil", async () => {
      const { onClose, onOpenProfile, onBanMember } = await openMembersTab();

      const row = screen.getByText("Usuario 6").closest("li") as HTMLElement;
      await userEvent.click(
        within(row).getByRole("button", { name: "Banear" }),
      );

      expect(onBanMember).toHaveBeenCalledWith({
        userId: "u6",
        name: "Usuario 6",
        avatarSrc: null,
      });
      expect(onOpenProfile).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("busca miembros por nombre en el back, desde la primera pagina", async () => {
      await openMembersTab();

      await userEvent.type(screen.getByRole("searchbox"), "usuario 6");

      await waitFor(() =>
        expect(screen.getAllByRole("listitem")).toHaveLength(1),
      );
      expect(screen.getByText("Usuario 6")).toBeInTheDocument();
      expect(listMembersRequest).toHaveBeenLastCalledWith("s1", {
        search: "usuario 6",
        limit: 10,
        offset: 0,
      });
    });
  });

  describe("perfiles de los usuarios", () => {
    it("muestra el nombre del perfil que viene con el baneo, sin pedirlo aparte", async () => {
      listBansRequest.mockResolvedValue({
        ok: true,
        bans: [
          {
            ...makeBans(1)[0],
            profile: { ...profileOf("u1"), name: "Nova" },
          },
        ],
        total: 1,
      });
      renderBansModal();

      expect(await screen.findByText("Nova")).toBeInTheDocument();
      expect(getPublicProfileRequest).not.toHaveBeenCalled();
    });

    it("si el perfil todavia no se replico, lo completa con GET /users/:id", async () => {
      getPublicProfileRequest.mockResolvedValue({
        ok: true,
        user: { ...profileOf("u1"), id: "u1", name: "Nova" },
      });
      listBansRequest.mockResolvedValue({
        ok: true,
        bans: [{ ...makeBans(1)[0], profile: null }],
        total: 1,
      });
      renderBansModal();

      expect(await screen.findByText("Nova")).toBeInTheDocument();
      expect(getPublicProfileRequest).toHaveBeenCalledWith("u1");
    });

    it("si ese pedido falla, dice 'Usuario desconocido'", async () => {
      getPublicProfileRequest.mockResolvedValue({ ok: false, message: "x" });
      listBansRequest.mockResolvedValue({
        ok: true,
        bans: [{ ...makeBans(1)[0], profile: null }],
        total: 1,
      });
      renderBansModal();

      expect(
        await screen.findByText("Usuario desconocido"),
      ).toBeInTheDocument();
      expect(getPublicProfileRequest).toHaveBeenCalled();
    });
  });
});
