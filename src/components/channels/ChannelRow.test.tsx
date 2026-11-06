import {
  VOICE_CALL_DURATION_LABEL,
  type Channel,
  type UnreadFlags,
} from "@discordia/client-shared";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SortableChannelRow } from "./ChannelRow";

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

const channel = { id: "c1", name: "general", kind: "text" } as Channel;

function renderRow(
  unread: UnreadFlags | 0 = 0,
  canManage = false,
  canManagePermissions = false,
) {
  const onEditPermissions = vi.fn();
  render(
    <SortableChannelRow
      channel={channel}
      active={false}
      canManage={canManage}
      canManagePermissions={canManagePermissions}
      unread={unread === 0 ? undefined : unread}
      onClick={vi.fn()}
      onEdit={vi.fn()}
      onEditPermissions={onEditPermissions}
      onDelete={vi.fn()}
    />,
  );
  return { onEditPermissions };
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Opciones del canal" }));
}

describe("ChannelRow", () => {
  it("leido no muestra la marca", () => {
    renderRow(0);
    expect(screen.getByRole("button", { name: /general/ })).not.toHaveAttribute(
      "title",
    );
    expect(document.querySelector("[aria-hidden]")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("con mensajes sin leer marca el canal a la izquierda y resalta el nombre", () => {
    renderRow({ unread: true, mentionCount: 0 });
    const row = screen.getByRole("button", { name: /general/ });
    expect(row).toHaveAttribute("title", "Mensajes sin leer");
    expect(screen.getByText("general")).toHaveClass("font-semibold");
    expect(document.querySelector("[aria-hidden]")).not.toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("con menciones sin leer suma el contador", () => {
    renderRow({ unread: true, mentionCount: 3 });
    expect(
      screen.getByRole("status", { name: "3 menciones sin leer" }),
    ).toHaveTextContent("3");
    expect(screen.getByText("general")).toHaveClass("font-semibold");
  });

  it("el contador se oculta al pasar el mouse para no tapar el boton de opciones", () => {
    renderRow({ unread: true, mentionCount: 2 }, true);
    expect(screen.getByRole("status")).toHaveClass("group-hover:opacity-0");
  });

  it("sin permisos de gestion no ofrece el menu del canal", () => {
    renderRow(0, false, false);
    expect(
      screen.queryByRole("button", { name: "Opciones del canal" }),
    ).toBeNull();
  });

  it("con MANAGE_ROLES pero sin MANAGE_CHANNELS solo ofrece sobrescribir permisos", () => {
    const { onEditPermissions } = renderRow(0, false, true);
    openMenu();

    expect(screen.queryByText("Editar canal")).toBeNull();
    expect(screen.queryByText("Eliminar canal")).toBeNull();
    fireEvent.click(screen.getByText("Sobrescribir permisos"));
    expect(onEditPermissions).toHaveBeenCalled();
  });

  it("con MANAGE_CHANNELS sin MANAGE_ROLES no ofrece sobrescribir permisos", () => {
    renderRow(0, true, false);
    openMenu();

    expect(screen.getByText("Editar canal")).toBeInTheDocument();
    expect(screen.queryByText("Sobrescribir permisos")).toBeNull();
  });

  describe("notificaciones", () => {
    function renderNotificationRow(isMuted = false) {
      const onNotifications = vi.fn();
      render(
        <SortableChannelRow
          channel={channel}
          active={false}
          canManage={false}
          isMuted={isMuted}
          onNotifications={onNotifications}
          onClick={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      return { onNotifications };
    }

    it("cualquier miembro ve el menu con la opcion de notificaciones", () => {
      const { onNotifications } = renderNotificationRow();
      openMenu();

      expect(screen.queryByText("Editar canal")).toBeNull();
      expect(screen.queryByText("Eliminar canal")).toBeNull();
      fireEvent.click(screen.getByText("Notificaciones"));
      expect(onNotifications).toHaveBeenCalled();
    });

    it("sin la opcion de notificaciones no se agrega al menu de gestion", () => {
      renderRow(0, true, false);
      openMenu();

      expect(screen.queryByText("Notificaciones")).toBeNull();
    });

    it("un canal silenciado lo indica junto al nombre", () => {
      renderNotificationRow(true);

      expect(screen.getByLabelText("Silenciado")).toBeInTheDocument();
    });

    it("un canal que no esta silenciado no muestra el indicador", () => {
      renderNotificationRow(false);

      expect(screen.queryByLabelText("Silenciado")).toBeNull();
    });
  });

  describe("duracion de la llamada", () => {
    const voiceChannel = { ...channel, kind: "voice" } as Channel;
    const START = Date.parse("2026-11-01T16:00:00Z");

    function renderVoiceRow(callStartedAt?: number) {
      render(
        <SortableChannelRow
          channel={voiceChannel}
          active={false}
          canManage
          onClick={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          callStartedAt={callStartedAt}
        />,
      );
    }

    it("con una llamada en curso muestra hace cuanto empezo", () => {
      vi.useFakeTimers();
      vi.setSystemTime(START + 65_000);

      renderVoiceRow(START);

      expect(
        screen.getByLabelText(`${VOICE_CALL_DURATION_LABEL}: 1:05`),
      ).toBeInTheDocument();
      vi.useRealTimers();
    });

    it("sin llamada no muestra duracion", () => {
      renderVoiceRow(undefined);
      expect(screen.queryByTitle(VOICE_CALL_DURATION_LABEL)).toBeNull();
    });
  });
});
