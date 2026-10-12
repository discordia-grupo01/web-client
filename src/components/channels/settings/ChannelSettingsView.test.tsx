import {
  type Channel,
  type ChannelOverride,
  LOSE_CHANNEL_ACCESS_TITLE,
  PERMISSION_NOT_HELD_HINT,
  type Role,
  type RolePermission,
} from "@discordia/client-shared";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteChannelOverrideRequest,
  listChannelOverridesRequest,
  setChannelOverrideRequest,
} from "@/services/channel-permissions/client";
import { updateChannelRequest } from "@/services/channels/client";

import { ChannelSettingsView } from "./ChannelSettingsView";

vi.mock("@/services/channel-permissions/client", () => ({
  listChannelOverridesRequest: vi.fn(),
  setChannelOverrideRequest: vi.fn(),
  deleteChannelOverrideRequest: vi.fn(),
}));
vi.mock("@/services/channels/client", () => ({
  updateChannelRequest: vi.fn(),
}));

const list = vi.mocked(listChannelOverridesRequest);
const put = vi.mocked(setChannelOverrideRequest);
const remove = vi.mocked(deleteChannelOverrideRequest);
const update = vi.mocked(updateChannelRequest);

const CHANNEL: Channel = {
  id: "ch1",
  name: "anuncios",
  kind: "text",
  position: 0,
  category_id: null,
  topic: null,
};

function role(
  id: string,
  position: number,
  permissions: RolePermission[] = [],
  isEveryone = false,
): Role {
  return {
    id,
    server_id: "s1",
    name: isEveryone ? "@everyone" : id,
    color: "#99aab5",
    position,
    permissions,
    is_everyone: isEveryone,
  } as Role;
}

const EVERYONE = role(
  "everyone",
  99,
  ["VIEW_CHANNELS", "SEND_MESSAGES", "ADD_REACTIONS", "CONNECT"],
  true,
);
const ADMIN_ROLE = role("admin", 1, ["MANAGE_SERVER"]);
const MOD = role("mod", 2, ["MANAGE_ROLES"]);
const MEMBER = role("miembro", 3);

function renderView({
  channel = CHANNEL,
  myRoles = [EVERYONE, MOD],
  isOwner = false,
  canManageChannel = true,
  overrides = [] as ChannelOverride[],
} = {}) {
  list.mockResolvedValue({ ok: true, overrides });
  const props = {
    onClose: vi.fn(),
    onChannelUpdated: vi.fn(),
    onPermissionsSaved: vi.fn(),
    onDelete: vi.fn(),
  };
  render(
    <ChannelSettingsView
      channel={channel}
      categoryName="General"
      initialSection="permissions"
      canManageChannel={canManageChannel}
      canManagePermissions
      isOwner={isOwner}
      myRoles={myRoles}
      serverRoles={[EVERYONE, ADMIN_ROLE, MOD, MEMBER]}
      {...props}
    />,
  );
  return props;
}

async function waitForEditor() {
  await screen.findByRole("heading", { name: "@everyone" });
}

beforeEach(() => {
  vi.clearAllMocks();
  put.mockResolvedValue({ ok: true, override: null });
  remove.mockResolvedValue({ ok: true });
});

describe("ChannelSettingsView", () => {
  it("abre en Permisos con @everyone seleccionado", async () => {
    renderView();
    await waitForEditor();

    expect(screen.getByText(/aplican solo a #anuncios/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Denegar: Ver canal" }),
    ).toBeEnabled();
  });

  it("en un canal de texto no ofrece Conectarse", async () => {
    renderView();
    await waitForEditor();

    expect(
      screen.queryByRole("group", { name: "Conectarse" }),
    ).not.toBeInTheDocument();
  });

  it("en un canal de voz deja negar Conectarse a un rol", async () => {
    const props = renderView({
      channel: { ...CHANNEL, name: "juegos", kind: "voice" },
    });
    await waitForEditor();

    expect(
      screen.queryByRole("group", { name: "Enviar mensajes" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Denegar: Conectarse" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(props.onPermissionsSaved).toHaveBeenCalled());
    expect(put).toHaveBeenCalledWith("ch1", {
      roleId: "everyone",
      allow: [],
      deny: ["CONNECT"],
    });
  });

  it("no deja permitir un permiso que el actor no tiene", async () => {
    renderView();
    await waitForEditor();

    const allow = screen.getByRole("button", {
      name: "Permitir: Gestionar mensajes",
    });
    expect(allow).toBeDisabled();
    expect(allow).toHaveAttribute("title", PERMISSION_NOT_HELD_HINT);
  });

  it("los roles por encima del actor aparecen deshabilitados al agregar", async () => {
    renderView();
    await waitForEditor();

    fireEvent.click(screen.getByRole("button", { name: "Agregar rol" }));
    const menu = screen.getByRole("menu");

    expect(
      within(menu).getByRole("menuitem", { name: "admin" }),
    ).toBeDisabled();
    expect(within(menu).getByRole("menuitem", { name: "mod" })).toBeDisabled();
    expect(
      within(menu).getByRole("menuitem", { name: "miembro" }),
    ).toBeEnabled();
  });

  it("guarda la excepcion solo para el rol y avisa que cambiaron los canales", async () => {
    const props = renderView();
    await waitForEditor();

    fireEvent.click(screen.getByRole("button", { name: "Agregar rol" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "miembro" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Denegar: Enviar mensajes" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(props.onPermissionsSaved).toHaveBeenCalled());
    expect(put).toHaveBeenCalledWith("ch1", {
      roleId: "miembro",
      allow: [],
      deny: ["SEND_MESSAGES"],
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("Limpiar un rol con excepcion la borra al guardar", async () => {
    renderView({
      overrides: [
        {
          channel_id: "ch1",
          role_id: "miembro",
          allow: [],
          deny: ["ADD_REACTIONS"],
          updated_at: "2026-10-01T00:00:00Z",
        },
      ],
    });
    await waitForEditor();

    fireEvent.click(screen.getByRole("button", { name: "miembro" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith("ch1", "miembro"));
  });

  it("pide confirmacion si el actor se queda sin ver el canal", async () => {
    renderView();
    await waitForEditor();

    fireEvent.click(screen.getByRole("button", { name: "Denegar: Ver canal" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      await screen.findByRole("heading", { name: LOSE_CHANNEL_ACCESS_TITLE }),
    ).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Guardar igual" }));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith("ch1", {
        roleId: "everyone",
        allow: [],
        deny: ["VIEW_CHANNELS"],
      }),
    );
  });

  it("al dueño no le pide confirmacion: siempre ve el canal", async () => {
    renderView({ isOwner: true });
    await waitForEditor();

    fireEvent.click(screen.getByRole("button", { name: "Denegar: Ver canal" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(
      screen.queryByRole("heading", { name: LOSE_CHANNEL_ACCESS_TITLE }),
    ).toBeNull();
  });

  it("no cierra con cambios sin guardar", async () => {
    const props = renderView();
    await waitForEditor();

    fireEvent.click(
      screen.getByRole("button", { name: "Denegar: Agregar reacciones" }),
    );
    fireEvent.keyDown(window, { key: "Escape" });

    expect(props.onClose).not.toHaveBeenCalled();
    expect(
      screen.getByRole("region", { name: /cambios sin guardar/i }),
    ).toHaveClass("bg-danger");
  });

  it("sin MANAGE_CHANNELS no muestra Vista general ni Eliminar canal", async () => {
    renderView({ canManageChannel: false });
    await waitForEditor();

    expect(screen.queryAllByRole("button", { name: "Vista general" })).toEqual(
      [],
    );
    expect(screen.queryAllByRole("button", { name: "Eliminar canal" })).toEqual(
      [],
    );
  });

  it("guarda el tema del canal desde Vista general", async () => {
    update.mockResolvedValue({
      ok: true,
      channel: { ...CHANNEL, topic: "Novedades" },
    });
    const props = renderView();
    await waitForEditor();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Vista general" })[0],
    );
    fireEvent.change(screen.getByLabelText("Tema del canal"), {
      target: { value: "Novedades" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(props.onChannelUpdated).toHaveBeenCalledWith({
        ...CHANNEL,
        topic: "Novedades",
      }),
    );
    expect(update).toHaveBeenCalledWith("ch1", { topic: "Novedades" });
    expect(put).not.toHaveBeenCalled();
  });
});
