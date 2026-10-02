import type { Message, MessageAuthor } from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { MessageList } from "./MessageList";

const ANA: MessageAuthor = {
  id: "u1",
  name: "Ana",
  avatarUrl: null,
  roleName: "Moderador",
  roleColor: "#38a169",
};

function mensaje(cambios: Partial<Message> & { id: string }): Message {
  return {
    channel_id: "ch1",
    server_id: "s1",
    user_id: "u1",
    content: "hola",
    inserted_at: "2026-09-29T15:00:00Z",
    edited_at: null,
    deleted_at: null,
    reactions: [],
    ...cambios,
  };
}

function renderList(props: Partial<ComponentProps<typeof MessageList>>) {
  return render(
    <MessageList
      channelName="general"
      messages={[]}
      authors={{ u1: ANA }}
      currentUserId="u1"
      canManageMessages={false}
      onToggleReaction={vi.fn()}
      onEditMessage={vi.fn()}
      onDeleteMessage={vi.fn()}
      {...props}
    />,
  );
}

describe("MessageList", () => {
  it("muestra el nombre del autor una sola vez por grupo", () => {
    renderList({
      messages: [
        mensaje({ id: "1", content: "primero" }),
        mensaje({ id: "2", content: "segundo" }),
      ],
    });

    expect(screen.getByText("primero")).toBeInTheDocument();
    expect(screen.getByText("segundo")).toBeInTheDocument();
    expect(screen.getAllByText("Ana")).toHaveLength(1);
    expect(screen.getByText("Moderador")).toBeInTheDocument();
  });

  it("resalta las menciones sin resolver como genericas", () => {
    renderList({
      messages: [mensaje({ id: "1", content: "hola @Beto" })],
    });

    expect(screen.getByText("@Beto")).toHaveClass("text-highlight");
  });

  it("tocar una reaccion la alterna en ese mensaje", async () => {
    const onToggleReaction = vi.fn();
    renderList({
      messages: [
        mensaje({
          id: "1",
          reactions: [{ emoji: "🔥", count: 2, reacted_by_me: false }],
        }),
      ],
      onToggleReaction,
    });

    await userEvent.click(screen.getByRole("button", { name: "🔥 2" }));

    expect(onToggleReaction).toHaveBeenCalledWith("1", "🔥");
  });

  it("muestra el placeholder de un mensaje borrado", () => {
    renderList({
      messages: [
        mensaje({ id: "1", content: "", deleted_at: "2026-09-29T16:00:00Z" }),
      ],
    });

    expect(screen.getByText("Mensaje eliminado.")).toBeInTheDocument();
  });

  it("editar un mensaje propio llama a onEditMessage con el nuevo contenido", async () => {
    const onEditMessage = vi.fn();
    renderList({
      messages: [mensaje({ id: "1", user_id: "u1", content: "hola" })],
      currentUserId: "u1",
      onEditMessage,
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Editar mensaje" }),
    );
    const textarea = screen.getByRole("textbox");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "chau{Enter}");

    expect(onEditMessage).toHaveBeenCalledWith("1", "chau");
  });

  it("no se puede editar un mensaje ajeno", () => {
    renderList({
      messages: [mensaje({ id: "1", user_id: "otro", content: "hola" })],
      currentUserId: "u1",
    });

    expect(
      screen.queryByRole("button", { name: "Editar mensaje" }),
    ).not.toBeInTheDocument();
  });

  it("eliminar un mensaje ajeno con permiso de moderacion llama a onDeleteMessage", async () => {
    const onDeleteMessage = vi.fn();
    renderList({
      messages: [mensaje({ id: "1", user_id: "otro", content: "hola" })],
      currentUserId: "u1",
      canManageMessages: true,
      onDeleteMessage,
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar mensaje" }),
    );

    expect(onDeleteMessage).toHaveBeenCalledWith("1");
  });

  describe("cargar mensajes anteriores", () => {
    it("muestra el boton cuando hay mas y lo dispara", async () => {
      const onLoadOlder = vi.fn();
      renderList({
        messages: [mensaje({ id: "1" })],
        hasMore: true,
        onLoadOlder,
      });

      await userEvent.click(
        screen.getByRole("button", { name: "Cargar mensajes anteriores" }),
      );

      expect(onLoadOlder).toHaveBeenCalledTimes(1);
    });

    it("mientras carga se deshabilita", () => {
      renderList({
        messages: [mensaje({ id: "1" })],
        hasMore: true,
        isLoadingOlder: true,
        onLoadOlder: vi.fn(),
      });

      expect(
        screen.getByRole("button", { name: "Cargando mensajes…" }),
      ).toBeDisabled();
    });

    it("la bienvenida del canal solo aparece cuando ya no hay mas historial", () => {
      const { rerender } = renderList({
        messages: [mensaje({ id: "1" })],
        hasMore: true,
        onLoadOlder: vi.fn(),
      });
      expect(
        screen.queryByText(/Bienvenido a #general/),
      ).not.toBeInTheDocument();

      rerender(
        <MessageList
          channelName="general"
          messages={[mensaje({ id: "1" })]}
          authors={{ u1: ANA }}
          currentUserId="u1"
          canManageMessages={false}
          hasMore={false}
          onToggleReaction={vi.fn()}
          onEditMessage={vi.fn()}
          onDeleteMessage={vi.fn()}
        />,
      );

      expect(screen.getByText(/Bienvenido a #general/)).toBeInTheDocument();
    });
  });
});
