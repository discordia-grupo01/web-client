import type { ListMessagesResult, Message } from "@discordia/client-shared";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchMessagesRequest } from "./client";
import { acquireSocket } from "./socket";
import { useChannelMessages } from "./useChannelMessages";

vi.mock("./client", () => ({ fetchMessagesRequest: vi.fn() }));
vi.mock("./socket", () => ({
  acquireSocket: vi.fn(),
  onSocketSessionExpired: vi.fn(() => () => {}),
}));

/** Respuesta de un `push` o del `join` de Phoenix: se dispara a mano desde el test. */
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
  const room = {
    handlers,
    pushes,
    joinPush,
    errorHandler: null as null | (() => void),
    on: vi.fn((event: string, callback: (payload: unknown) => void) => {
      handlers[event] = callback;
      return 1;
    }),
    onError: vi.fn((callback: () => void) => {
      room.errorHandler = callback;
      return 1;
    }),
    join: vi.fn(() => joinPush),
    leave: vi.fn(),
    push: vi.fn((event: string, payload: unknown) => {
      const push = new FakePush();
      pushes.push({ event, payload, push });
      return push;
    }),
  };
  return room;
}

function message(id: string, insertedAt: string): Message {
  return {
    id,
    channel_id: "ch1",
    server_id: "s1",
    user_id: "u1",
    content: `mensaje ${id}`,
    inserted_at: insertedAt,
  };
}

const M1 = message("m1", "2026-10-01T12:00:00.000Z");
const M2 = message("m2", "2026-10-01T12:01:00.000Z");
const M3 = message("m3", "2026-10-01T12:02:00.000Z");
const M4 = message("m4", "2026-10-01T12:03:00.000Z");

function history(
  messages: Message[],
  nextCursor: string | null = null,
): ListMessagesResult {
  return { ok: true, messages, nextCursor };
}

let room: ReturnType<typeof createRoom>;
let release: ReturnType<typeof vi.fn>;
let channelParams: unknown;

beforeEach(() => {
  vi.clearAllMocks();
  room = createRoom();
  release = vi.fn();
  channelParams = undefined;
  vi.mocked(acquireSocket).mockResolvedValue({
    ok: true,
    release,
    socket: {
      channel: vi.fn((_topic: string, params: unknown) => {
        channelParams = params;
        return room;
      }),
    },
  } as never);
  vi.mocked(fetchMessagesRequest).mockResolvedValue(history([M2, M1]));
});

async function mountAndJoin() {
  const view = renderHook(() => useChannelMessages({ id: "ch1" }));
  await waitFor(() => expect(room.join).toHaveBeenCalled());
  act(() => room.joinPush.fire("ok"));
  await waitFor(() => expect(view.result.current.messages).not.toBeNull());
  return view;
}

describe("useChannelMessages: carga y tiempo real", () => {
  it("al unirse carga el historial y lo deja de mas viejo a mas nuevo", async () => {
    const { result } = await mountAndJoin();

    expect(result.current.status).toBe("ready");
    expect(result.current.messages?.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("se une al topic del canal", async () => {
    const view = renderHook(() => useChannelMessages({ id: "ch1" }));
    await waitFor(() => expect(room.join).toHaveBeenCalled());
    const socket = (await vi.mocked(acquireSocket).mock.results[0].value)
      .socket as { channel: ReturnType<typeof vi.fn> };

    expect(socket.channel).toHaveBeenCalledWith(
      "channel:ch1",
      expect.anything(),
    );
    view.unmount();
  });

  it("agrega los mensajes en vivo sin duplicar el que ya estaba", async () => {
    const { result } = await mountAndJoin();

    act(() => room.handlers.new_message(M3));
    act(() => room.handlers.new_message(M3));
    act(() => room.handlers.new_message(M1));

    expect(result.current.messages?.map((m) => m.id)).toEqual([
      "m1",
      "m2",
      "m3",
    ]);
  });

  it("mezcla los missed_messages tras reconectar", async () => {
    const { result } = await mountAndJoin();

    act(() =>
      room.handlers.missed_messages({ messages: [M3], next_cursor: null }),
    );

    expect(result.current.messages?.map((m) => m.id)).toEqual([
      "m1",
      "m2",
      "m3",
    ]);
  });

  it("si missed_messages trae next_cursor sigue pidiendo con after hasta completar", async () => {
    await mountAndJoin();
    vi.mocked(fetchMessagesRequest).mockClear();
    vi.mocked(fetchMessagesRequest)
      .mockResolvedValueOnce({
        ok: true,
        messages: [M3],
        nextCursor: "m3",
      })
      .mockResolvedValueOnce(history([M4]));

    act(() =>
      room.handlers.missed_messages({ messages: [], next_cursor: "m2" }),
    );

    await waitFor(() => expect(fetchMessagesRequest).toHaveBeenCalledTimes(2));
    expect(fetchMessagesRequest).toHaveBeenNthCalledWith(1, "ch1", {
      after: "m2",
    });
    expect(fetchMessagesRequest).toHaveBeenNthCalledWith(2, "ch1", {
      after: "m3",
    });
  });

  it("resync_required descarta lo que habia y recarga lo ultimo", async () => {
    const { result } = await mountAndJoin();
    vi.mocked(fetchMessagesRequest).mockResolvedValue(history([M3]));

    act(() => room.handlers.resync_required({}));

    await waitFor(() =>
      expect(result.current.messages?.map((m) => m.id)).toEqual(["m3"]),
    );
  });

  it("el last_message_id de cada join es el id del mensaje mas nuevo", async () => {
    await mountAndJoin();

    expect(
      (channelParams as { last_message_id?: string }).last_message_id,
    ).toBe("m2");
  });

  it("mientras no hay mensajes el join no manda last_message_id", async () => {
    vi.mocked(fetchMessagesRequest).mockResolvedValue(history([]));
    await mountAndJoin();

    expect(
      (channelParams as { last_message_id?: string }).last_message_id,
    ).toBeUndefined();
  });

  it("un corte de conexion pasa a reconnecting y al re-unirse vuelve a ready", async () => {
    const { result } = await mountAndJoin();

    act(() => room.errorHandler?.());
    expect(result.current.status).toBe("reconnecting");

    act(() => room.joinPush.fire("ok"));
    expect(result.current.status).toBe("ready");
  });

  it("al desmontar sale del canal y suelta el socket", async () => {
    const { unmount } = await mountAndJoin();

    unmount();

    expect(room.leave).toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });
});

describe("useChannelMessages: join rechazado", () => {
  it("FORBIDDEN corta los reintentos (leave) y muestra el motivo", async () => {
    const view = renderHook(() => useChannelMessages({ id: "ch1" }));
    await waitFor(() => expect(room.join).toHaveBeenCalled());

    act(() => room.joinPush.fire("error", { error: { code: "FORBIDDEN" } }));

    expect(view.result.current.status).toBe("forbidden");
    expect(view.result.current.statusMessage).toContain("permiso");
    expect(room.leave).toHaveBeenCalled();
  });

  it("un error que no es del back (canal caido) no corta: sigue reintentando", async () => {
    const view = renderHook(() => useChannelMessages({ id: "ch1" }));
    await waitFor(() => expect(room.join).toHaveBeenCalled());

    act(() => room.joinPush.fire("error", { reason: "join crashed" }));

    expect(view.result.current.status).toBe("reconnecting");
    expect(room.leave).not.toHaveBeenCalled();
  });

  it("CHANNEL_NOT_FOUND se reintenta (el canal puede ser recien creado) antes de rendirse", async () => {
    const view = renderHook(() => useChannelMessages({ id: "ch1" }));
    await waitFor(() => expect(room.join).toHaveBeenCalled());
    const notFound = { error: { code: "CHANNEL_NOT_FOUND" } };

    act(() => room.joinPush.fire("error", notFound));
    act(() => room.joinPush.fire("error", notFound));
    expect(view.result.current.status).toBe("loading");
    expect(room.leave).not.toHaveBeenCalled();

    act(() => room.joinPush.fire("error", notFound));
    expect(view.result.current.status).toBe("notFound");
    expect(room.leave).toHaveBeenCalled();
  });

  it("sin sesion para abrir el socket muestra sesion expirada", async () => {
    vi.mocked(acquireSocket).mockResolvedValue({
      ok: false,
      sessionExpired: true,
    });

    const { result } = renderHook(() => useChannelMessages({ id: "ch1" }));

    await waitFor(() => expect(result.current.status).toBe("sessionExpired"));
  });

  it("un fallo del historial en la primera carga se muestra con reintento", async () => {
    vi.mocked(fetchMessagesRequest).mockResolvedValue({
      ok: false,
      message: "No pudimos cargar los mensajes.",
    });
    const view = renderHook(() => useChannelMessages({ id: "ch1" }));
    await waitFor(() => expect(room.join).toHaveBeenCalled());

    act(() => room.joinPush.fire("ok"));

    await waitFor(() => expect(view.result.current.status).toBe("error"));
    expect(view.result.current.statusMessage).toBe(
      "No pudimos cargar los mensajes.",
    );
  });
});

describe("useChannelMessages: enviar", () => {
  it("manda new_message y resuelve ok sin agregar el mensaje a la lista", async () => {
    const { result } = await mountAndJoin();

    let outcome: unknown;
    act(() => {
      void result.current.sendMessage("hola").then((r) => (outcome = r));
    });
    expect(room.pushes[0]).toMatchObject({
      event: "new_message",
      payload: { content: "hola" },
    });
    await act(async () => room.pushes[0].push.fire("ok"));

    expect(outcome).toEqual({ ok: true });
    // El mensaje llega por el socket, no por la respuesta del envio.
    expect(result.current.messages).toHaveLength(2);
  });

  it("traduce el error del back", async () => {
    const { result } = await mountAndJoin();

    let outcome: { ok: boolean; message?: string } | undefined;
    act(() => {
      void result.current.sendMessage("hola").then((r) => (outcome = r));
    });
    await act(async () =>
      room.pushes[0].push.fire("error", { error: { code: "FORBIDDEN" } }),
    );

    expect(outcome?.ok).toBe(false);
    expect(outcome?.message).toContain("permiso");
  });

  it("un timeout da el mensaje generico de envio", async () => {
    const { result } = await mountAndJoin();

    let outcome: { ok: boolean; message?: string } | undefined;
    act(() => {
      void result.current.sendMessage("hola").then((r) => (outcome = r));
    });
    await act(async () => room.pushes[0].push.fire("timeout"));

    expect(outcome).toEqual({
      ok: false,
      message: "No pudimos enviar el mensaje. Intentá de nuevo.",
    });
  });

  it("no manda un mensaje vacio ni demasiado largo", async () => {
    const { result } = await mountAndJoin();

    const vacio = await result.current.sendMessage("   ");
    const largo = await result.current.sendMessage("a".repeat(2001));

    expect(vacio.ok).toBe(false);
    expect(largo.ok).toBe(false);
    expect(room.push).not.toHaveBeenCalled();
  });

  it("no manda si el canal no esta unido", async () => {
    const { result } = await mountAndJoin();
    act(() => room.errorHandler?.());

    const outcome = await result.current.sendMessage("hola");

    expect(outcome.ok).toBe(false);
    expect(room.push).not.toHaveBeenCalled();
  });
});

describe("useChannelMessages: maqueta local (editar, borrar, reaccionar)", () => {
  it("editar y borrar cambian solo el estado local", async () => {
    const { result } = await mountAndJoin();

    act(() => result.current.editMessage("m1", "editado"));
    expect(result.current.messages?.[0]).toMatchObject({
      content: "editado",
    });
    expect(result.current.messages?.[0].edited_at).toBeTruthy();

    act(() => result.current.deleteMessage("m2"));
    expect(result.current.messages?.[1]).toMatchObject({ content: "" });
    expect(result.current.messages?.[1].deleted_at).toBeTruthy();
    expect(room.push).not.toHaveBeenCalled();
  });

  it("reaccionar funciona aunque el mensaje real no traiga reactions", async () => {
    const { result } = await mountAndJoin();

    act(() => result.current.toggleReaction("m1", "🔥"));

    expect(result.current.messages?.[0].reactions).toEqual([
      { emoji: "🔥", count: 1, reacted_by_me: true },
    ]);
  });

  it("una edicion local no se pierde cuando el mismo mensaje vuelve a llegar", async () => {
    const { result } = await mountAndJoin();
    act(() => result.current.editMessage("m1", "editado"));

    act(() =>
      room.handlers.missed_messages({ messages: [M1], next_cursor: null }),
    );

    expect(result.current.messages?.[0].content).toBe("editado");
  });
});

describe("useChannelMessages: paginacion", () => {
  it("cargar anteriores usa el cursor y suma los mensajes viejos", async () => {
    vi.mocked(fetchMessagesRequest).mockResolvedValueOnce(history([M2], "m2"));
    const { result } = await mountAndJoin();
    expect(result.current.hasMore).toBe(true);

    vi.mocked(fetchMessagesRequest).mockResolvedValueOnce(history([M1], null));
    await act(async () => result.current.loadOlder());

    expect(fetchMessagesRequest).toHaveBeenLastCalledWith("ch1", {
      before: "m2",
    });
    expect(result.current.messages?.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(result.current.hasMore).toBe(false);
  });
});
