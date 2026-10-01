import { type Ban } from "@discordia/client-shared";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BansModal } from "./BansModal";

const listBansRequest = vi.fn();
const unbanMemberRequest = vi.fn();
const listMembersRequest = vi.fn();

vi.mock("@/services/bans/client", () => ({
  listBansRequest: (...args: unknown[]) => listBansRequest(...args),
  unbanMemberRequest: (...args: unknown[]) => unbanMemberRequest(...args),
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

async function renderModal(count: number) {
  const bans = makeBans(count);
  listBansRequest.mockResolvedValue({ ok: true, bans, total: bans.length });
  const handlers = renderBansModal();
  await screen.findByText("Usuario 1");
  return handlers;
}

describe("BansModal", () => {
  it("pagina la lista de a 20 y navega con Siguiente", async () => {
    await renderModal(45);

    expect(screen.getAllByRole("listitem")).toHaveLength(20);
    expect(
      screen.getByText("Mostrando 1–20 de 45 baneados"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      screen.getByText("Mostrando 21–40 de 45 baneados"),
    ).toBeInTheDocument();
    expect(screen.getByText("Usuario 21")).toBeInTheDocument();
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

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Andrés")).toBeInTheDocument();
    expect(screen.getByText("1 resultado de 45 baneados")).toBeInTheDocument();
  });

  it("avisa cuando la busqueda no encuentra a nadie", async () => {
    await renderModal(3);

    await userEvent.type(screen.getByRole("searchbox"), "zzz");

    expect(
      screen.getByText("No hay baneados que coincidan con la búsqueda."),
    ).toBeInTheDocument();
  });

  it("revoca un baneo: lo saca de la lista y lo confirma", async () => {
    await renderModal(3);
    unbanMemberRequest.mockResolvedValue({ ok: true });

    const row = screen.getByText("Usuario 2").closest("li") as HTMLElement;
    await userEvent.click(within(row).getByRole("button", { name: "Revocar" }));

    expect(unbanMemberRequest).toHaveBeenCalledWith("s1", "u2");
    await waitFor(() => expect(screen.queryByText("Usuario 2")).toBeNull());
    expect(
      screen.getByText(/Se revocó el baneo de Usuario 2/),
    ).toBeInTheDocument();
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
      listMembersRequest.mockResolvedValue({
        ok: true,
        members,
        total: members.length,
      });
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

    it("busca miembros por nombre", async () => {
      await openMembersTab();

      await userEvent.type(screen.getByRole("searchbox"), "usuario 6");

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.getByText("1 resultado de 2 miembros")).toBeInTheDocument();
    });
  });

  describe("perfiles de los usuarios", () => {
    it("muestra el nombre del perfil que viene con el baneo", async () => {
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
    });

    it("si el perfil todavia no se replico, dice 'Usuario desconocido'", async () => {
      listBansRequest.mockResolvedValue({
        ok: true,
        bans: [{ ...makeBans(1)[0], profile: null }],
        total: 1,
      });
      renderBansModal();

      expect(
        await screen.findByText("Usuario desconocido"),
      ).toBeInTheDocument();
      expect(screen.queryByText("u1")).toBeNull();
    });
  });
});
