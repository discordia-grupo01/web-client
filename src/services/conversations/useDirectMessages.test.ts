import type {
  DirectConversation,
  Message,
  MessageAuthor,
} from "@discordia/client-shared";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { acquireSocket } from "@/services/messages/socket";
import { getPublicProfileRequest } from "@/services/profile/client";

import {
  listConversationsRequest,
  markConversationReadRequest,
} from "./client";
import { useDirectMessages } from "./useDirectMessages";

vi.mock("./client", () => ({
  listConversationsRequest: vi.fn(),
  markConversationReadRequest: vi.fn(),
}));
vi.mock("@/services/messages/socket", () => ({ acquireSocket: vi.fn() }));
vi.mock("@/services/profile/client", () => ({
  getPublicProfileRequest: vi.fn(),
}));
vi.mock("@/services/blocks/BlockedUsersContext", () => ({
  useBlockedUsersContext: () => ({ blockedIds: new Set(["blocked"]) }),
}));

class FakePush {
  private hooks: Record<string, (response?: unknown) => void> = {};
  receive(status: string, callback: (response?: unknown) => void) {
    this.hooks[status] = callback;
    return this;
  }
  fire(status: string, response?: unknown) {
    this.hooks[status]?.(response);
  }
}

function createRoom() {
  const handlers: Record<string, (payload: unknown) => void> = {};
  const pushes: { event: string; payload: unknown; push: FakePush }[] = [];
  const joinPush = new FakePush();
  return {
    handlers,
    pushes,
    joinPush,
    on: vi.fn((event: string, callback: (payload: unknown) => void) => {
      handlers[event] = callback;
    }),
    onError: vi.fn(),
    onClose: vi.fn(),
    join: vi.fn(() => joinPush),
    leave: vi.fn(),
    push: vi.fn((event: string, payload: unknown) => {
      const push = new FakePush();
      pushes.push({ event, payload, push });
      return push;
    }),
  };
}

const ME: MessageAuthor = {
  id: "me",
  name: "Yo",
  avatarUrl: null,
  roleName: null,
  roleColor: null,
};

function message(id: string, userId: string): Message {
  return {
    id,
    channel_id: "conv1",
    server_id: "",
    user_id: userId,
    content: `mensaje ${id}`,
    inserted_at: "2026-10-01T12:00:00.000Z",
  };
}

function conversation(extra: Partial<DirectConversation> = {}) {
  return {
    id: "conv1",
    partner_id: "ana",
    unread: false,
    blocked_by_me: false,
    last_message_at: "2026-10-01T12:00:00.000Z",
    last_message: message("m1", "ana"),
    ...extra,
  } satisfies DirectConversation;
}

let room: ReturnType<typeof createRoom>;

beforeEach(() => {
  vi.clearAllMocks();
  room = createRoom();
  vi.mocked(acquireSocket).mockResolvedValue({
    ok: true,
    release: vi.fn(),
    socket: { channel: vi.fn(() => room) },
  } as never);
  vi.mocked(listConversationsRequest).mockResolvedValue({
    ok: true,
    conversations: [conversation()],
  });
  vi.mocked(markConversationReadRequest).mockResolvedValue({ ok: true });
  vi.mocked(getPublicProfileRequest).mockResolvedValue({
    ok: true,
    user: { id: "ana", name: "Ana", avatar_url: null },
  } as never);
});

async function mountAndJoin(isViewActive = true) {
  const view = renderHook(() => useDirectMessages(ME, isViewActive));
  await waitFor(() => expect(room.join).toHaveBeenCalled());
  act(() => room.joinPush.fire("ok"));
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  // Deja terminar el pedido de perfiles de los otros participantes.
  await act(async () => {});
  return view;
}

describe("useDirectMessages", () => {
  it("carga las conversaciones y resuelve el nombre del otro", async () => {
    const { result } = await mountAndJoin();

    await waitFor(() =>
      expect(result.current.conversations[0].partner.name).toBe("Ana"),
    );
    expect(result.current.conversations[0].conversationId).toBe("conv1");
  });

  it("un new_dm del otro crea la conversacion y la deja sin leer", async () => {
    const { result } = await mountAndJoin();

    act(() =>
      room.handlers.new_dm({
        conversation_id: "conv2",
        partner_id: "beto",
        message: message("m2", "beto"),
      }),
    );

    expect(result.current.conversations[0]).toMatchObject({
      conversationId: "conv2",
      isUnread: true,
    });
  });

  it("abrir una conversacion sin leer la marca leida", async () => {
    vi.mocked(listConversationsRequest).mockResolvedValue({
      ok: true,
      conversations: [conversation({ unread: true })],
    });
    const { result } = await mountAndJoin();

    act(() => result.current.openConversation("ana"));

    await waitFor(() =>
      expect(markConversationReadRequest).toHaveBeenCalledWith("conv1"),
    );
    await waitFor(() =>
      expect(result.current.conversations[0].isUnread).toBe(false),
    );
  });

  it("no marca como leida si la vista de DMs no esta activa", async () => {
    vi.mocked(listConversationsRequest).mockResolvedValue({
      ok: true,
      conversations: [conversation({ unread: true })],
    });
    const { result } = await mountAndJoin(false);

    act(() => result.current.openConversation("ana"));

    expect(markConversationReadRequest).not.toHaveBeenCalled();
    expect(result.current.conversations[0].isUnread).toBe(true);
  });

  it("abrir a alguien sin conversacion deja un borrador", async () => {
    const { result } = await mountAndJoin();

    act(() => result.current.openConversation("nuevo", { ...ME, id: "nuevo" }));

    expect(result.current.activeSummary).toMatchObject({
      conversationId: null,
      lastMessage: null,
    });
  });

  it("el primer mensaje manda send_dm y crea la conversacion", async () => {
    const { result } = await mountAndJoin();
    act(() => result.current.openConversation("nuevo", { ...ME, id: "nuevo" }));

    let outcome: Promise<unknown> = Promise.resolve();
    act(() => {
      outcome = result.current.sendMessage("hola");
    });
    expect(room.pushes[0]).toMatchObject({
      event: "send_dm",
      payload: { to: "nuevo", content: "hola" },
    });
    act(() =>
      room.pushes[0].push.fire("ok", {
        conversation_id: "conv9",
        message: message("m9", "me"),
      }),
    );

    expect(await outcome).toEqual({ ok: true });
    expect(result.current.activeSummary?.conversationId).toBe("conv9");
  });

  it("si el otro te bloqueo el error no lo revela", async () => {
    const { result } = await mountAndJoin();
    act(() => result.current.openConversation("ana"));

    let outcome: Promise<unknown> = Promise.resolve();
    act(() => {
      outcome = result.current.sendMessage("hola");
    });
    act(() =>
      room.pushes[0].push.fire("error", {
        error: { code: "DM_NOT_DELIVERED" },
      }),
    );

    expect(await outcome).toEqual({
      ok: false,
      message: "No se pudo entregar el mensaje.",
    });
  });

  it("marca bloqueada la conversacion con alguien que bloqueaste", async () => {
    vi.mocked(listConversationsRequest).mockResolvedValue({
      ok: true,
      conversations: [conversation({ partner_id: "blocked" })],
    });
    const { result } = await mountAndJoin();

    expect(result.current.conversations[0].blockedByMe).toBe(true);
  });

  it("sin la sala unida no manda nada", async () => {
    const view = renderHook(() => useDirectMessages(ME, true));
    await waitFor(() => expect(room.join).toHaveBeenCalled());
    act(() => view.result.current.openConversation("ana"));

    const result = await view.result.current.sendMessage("hola");

    expect(result.ok).toBe(false);
    expect(room.push).not.toHaveBeenCalled();
  });
});
