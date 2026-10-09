import type { Channel } from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
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

function renderRow(unreadMentions?: number, canManage = false) {
  render(
    <SortableChannelRow
      channel={channel}
      active={false}
      canManage={canManage}
      unreadMentions={unreadMentions}
      onClick={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
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
});
