import type { Message, MessageAuthor } from "@discordia/client-shared";

import { render, screen, within } from "@testing-library/react";
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
    reactions: [],
    ...cambios,
  };
}

function renderList(props: Partial<ComponentProps<typeof MessageList>>) {
  return render(
    <MessageList
      welcome={<h2>Bienvenido a #general</h2>}
      label="Mensajes de #general"
      messages={[]}
      authors={{ u1: ANA }}
      currentUserId="u1"
      canManageMessages={false}
      canSendMessages
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

  it("si la edicion falla muestra el motivo y deja el formulario abierto", async () => {
    const onEditMessage = vi
      .fn()
      .mockResolvedValue({ ok: false, message: "No pudimos editar" });
    renderList({
      messages: [mensaje({ id: "1", user_id: "u1", content: "hola" })],
      onEditMessage,
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Editar mensaje" }),
    );
    await userEvent.type(screen.getByRole("textbox"), "!{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos editar",
    );
    expect(screen.getByRole("textbox")).toHaveValue("hola!");
  });

  it("no se puede editar el propio si ya no tiene SEND_MESSAGES", () => {
    renderList({
      messages: [mensaje({ id: "1", user_id: "u1" })],
      canSendMessages: false,
    });

    expect(
      screen.queryByRole("button", { name: "Editar mensaje" }),
    ).not.toBeInTheDocument();
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

  it("eliminar pide confirmacion y recien al confirmar llama a onDeleteMessage", async () => {
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
    expect(onDeleteMessage).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "¿Eliminar mensaje?" });
    expect(within(dialog).getByText("hola")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onDeleteMessage).toHaveBeenCalledWith("1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancelar la confirmacion no elimina el mensaje", async () => {
    const onDeleteMessage = vi.fn();
    renderList({
      messages: [mensaje({ id: "1", user_id: "u1", content: "hola" })],
      currentUserId: "u1",
      onDeleteMessage,
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar mensaje" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onDeleteMessage).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
          welcome={<h2>Bienvenido a #general</h2>}
          label="Mensajes de #general"
          messages={[mensaje({ id: "1" })]}
          authors={{ u1: ANA }}
          currentUserId="u1"
          canManageMessages={false}
          canSendMessages
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
