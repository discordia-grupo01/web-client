import type { Channel } from "@discordia/client-shared";

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
  unreadMentions?: number,
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
      unreadMentions={unreadMentions}
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
  it("sin menciones sin leer no muestra la marca", () => {
    renderRow(0);
    expect(screen.getByRole("button", { name: /general/ })).not.toHaveAttribute(
      "title",
    );
    expect(document.querySelector("[aria-hidden]")).toBeNull();
  });

  it("con menciones sin leer marca el canal a la izquierda y resalta el nombre", () => {
    renderRow(3);
    const row = screen.getByRole("button", { name: /general/ });
    expect(row).toHaveAttribute("title", "3 menciones sin leer");
    expect(screen.getByText("general")).toHaveClass("font-semibold");
    expect(document.querySelector("[aria-hidden]")).not.toBeNull();
  });

  it("no tapa el boton de opciones: no hay nada a la derecha del nombre", () => {
    renderRow(2, true);
    expect(screen.queryByRole("status")).toBeNull();
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
});
