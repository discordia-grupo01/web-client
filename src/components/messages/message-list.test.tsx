import type { Message, MessageAuthor } from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MessageList } from "./message-list";

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
    author_id: "u1",
    content: "hola",
    created_at: "2026-09-29T15:00:00Z",
    reactions: [],
    ...cambios,
  };
}

describe("MessageList", () => {
  it("muestra el nombre del autor una sola vez por grupo", () => {
    render(
      <MessageList
        channelName="general"
        messages={[
          mensaje({ id: "1", content: "primero" }),
          mensaje({ id: "2", content: "segundo" }),
        ]}
        authors={{ u1: ANA }}
        onToggleReaction={vi.fn()}
      />,
    );

    expect(screen.getByText("primero")).toBeInTheDocument();
    expect(screen.getByText("segundo")).toBeInTheDocument();
    expect(screen.getAllByText("Ana")).toHaveLength(1);
    expect(screen.getByText("Moderador")).toBeInTheDocument();
  });

  it("resalta las menciones", () => {
    render(
      <MessageList
        channelName="general"
        messages={[mensaje({ id: "1", content: "hola @Beto" })]}
        authors={{ u1: ANA }}
        onToggleReaction={vi.fn()}
      />,
    );

    expect(screen.getByText("@Beto")).toHaveClass("text-highlight");
  });

  it("tocar una reaccion la alterna en ese mensaje", async () => {
    const onToggleReaction = vi.fn();
    render(
      <MessageList
        channelName="general"
        messages={[
          mensaje({
            id: "1",
            reactions: [{ emoji: "🔥", count: 2, reacted_by_me: false }],
          }),
        ]}
        authors={{ u1: ANA }}
        onToggleReaction={onToggleReaction}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "🔥 2" }));

    expect(onToggleReaction).toHaveBeenCalledWith("1", "🔥");
  });
});
