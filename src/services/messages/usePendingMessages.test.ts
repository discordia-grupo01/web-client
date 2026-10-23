import type { Message } from "@discordia/client-shared";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePendingMessages } from "./usePendingMessages";

type SendResult =
  { ok: true } | { ok: false; message: string; retryable?: boolean };

function msg(id: string, clientId?: string): Message {
  return {
    id,
    channel_id: "c1",
    server_id: "",
    user_id: "me",
    content: id,
    inserted_at: "2026-10-01T12:00:00.000Z",
    ...(clientId ? { client_id: clientId } : {}),
  };
}

function setup(chatKey = "c1", isReady = true) {
  const resolvers: ((result: SendResult) => void)[] = [];
  const send = vi.fn(
    (_content: string, _attachments?: readonly string[], _clientId?: string) =>
      new Promise<SendResult>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  const view = renderHook(
    ({ chat, ready }: { chat: string; ready: boolean }) =>
      usePendingMessages({
        chatKey: chat,
        channelId: chat,
        currentUserId: "me",
        isReady: ready,
        send,
      }),
    { initialProps: { chat: chatKey, ready: isReady } },
  );
  return { view, send, resolvers };
}

const clientIdOf = (send: ReturnType<typeof setup>["send"], call = 0) =>
  send.mock.calls[call][2];

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("usePendingMessages", () => {
  it("enviar texto devuelve void (el cuadro se limpia al instante) y el mensaje se ve enviando", async () => {
    const { view, send } = setup();

    let outcome: unknown = "sin llamar";
    act(() => {
      outcome = view.result.current.onSend("hola");
    });

    expect(outcome).toBeUndefined();
    expect(send).toHaveBeenCalledWith("hola", [], expect.any(String));
    expect(view.result.current.withPending([msg("m1")])).toMatchObject([
      { id: "m1" },
      { content: "hola", delivery: "sending", client_id: clientIdOf(send) },
    ]);
  });

  it("al llegar su eco con el mismo client id deja de verse como pendiente", async () => {
    const { view, send, resolvers } = setup();
    act(() => void view.result.current.onSend("hola"));
    await act(async () => resolvers[0]({ ok: true }));

    const echo = msg("real", clientIdOf(send));
    expect(view.result.current.withPending([echo]).map((m) => m.id)).toEqual([
      "real",
    ]);

    act(() => view.result.current.reconcile([echo]));
    expect(view.result.current.withPending([echo])).toEqual([echo]);
  });

  it("si falla, reintenta solo con el mismo client id y a los 3 intentos queda fallido", async () => {
    const { view, send, resolvers } = setup();
    act(() => void view.result.current.onSend("hola"));

    await act(async () => resolvers[0]({ ok: false, message: "x" }));
    await act(() => vi.advanceTimersByTimeAsync(1_000));
    await act(async () => resolvers[1]({ ok: false, message: "x" }));
    await act(() => vi.advanceTimersByTimeAsync(3_000));
    await act(async () =>
      resolvers[2]({ ok: false, message: "No se pudo enviar" }),
    );

    expect(send).toHaveBeenCalledTimes(3);
    expect(new Set(send.mock.calls.map((c) => c[2])).size).toBe(1);
    expect(view.result.current.withPending([])[0]).toMatchObject({
      delivery: "failed",
      delivery_error: "No se pudo enviar",
    });
  });

  it("Reintentar vuelve a mandar el fallido; Eliminar lo saca", async () => {
    const { view, send, resolvers } = setup();
    act(() => void view.result.current.onSend("hola"));
    await act(async () =>
      resolvers[0]({ ok: false, message: "x", retryable: false }),
    );
    const clientId = clientIdOf(send) as string;

    act(() => view.result.current.retry(clientId));
    expect(send).toHaveBeenCalledTimes(2);
    expect(view.result.current.withPending([])[0].delivery).toBe("sending");

    await act(async () =>
      resolvers[1]({ ok: false, message: "x", retryable: false }),
    );
    act(() => view.result.current.discard(clientId));
    expect(view.result.current.withPending([])).toEqual([]);
  });

  it("sin conexion espera en cola y sale solo al volver", async () => {
    const { view, send } = setup("c1", false);

    act(() => void view.result.current.onSend("hola"));
    expect(send).not.toHaveBeenCalled();
    expect(view.result.current.withPending([])[0].delivery).toBe("waiting");

    view.rerender({ chat: "c1", ready: true });

    expect(send).toHaveBeenCalledWith("hola", [], expect.any(String));
  });

  it("un fallido se recuerda: tras recargar vuelve como fallido, listo para reintentar", async () => {
    const first = setup();
    act(() => void first.view.result.current.onSend("hola"));
    await act(async () =>
      first.resolvers[0]({ ok: false, message: "x", retryable: false }),
    );
    first.view.unmount();

    const second = setup();

    expect(second.view.result.current.withPending([])[0]).toMatchObject({
      content: "hola",
      delivery: "failed",
    });
    expect(second.send).not.toHaveBeenCalled();
  });

  it("lo que supero las 24 h se descarta sin avisar", async () => {
    const first = setup();
    act(() => void first.view.result.current.onSend("viejo"));
    await act(async () =>
      first.resolvers[0]({ ok: false, message: "x", retryable: false }),
    );
    first.view.unmount();

    vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000 + 1);
    const second = setup();

    expect(second.view.result.current.withPending([])).toEqual([]);
  });

  it("cada chat tiene sus propios pendientes", async () => {
    const { view, resolvers } = setup("c1");
    act(() => void view.result.current.onSend("hola"));
    await act(async () =>
      resolvers[0]({ ok: false, message: "x", retryable: false }),
    );

    view.rerender({ chat: "c2", ready: true });
    expect(view.result.current.withPending([])).toEqual([]);

    view.rerender({ chat: "c1", ready: true });
    expect(view.result.current.withPending([])).toHaveLength(1);
  });

  it("con adjuntos se envia como siempre y espera la respuesta", () => {
    const { view, send } = setup();

    let outcome: unknown;
    act(() => {
      outcome = view.result.current.onSend("foto", ["a1"]);
    });

    expect(outcome).toBeInstanceOf(Promise);
    expect(send).toHaveBeenCalledWith("foto", ["a1"]);
    expect(view.result.current.withPending([])).toEqual([]);
  });

  it("un texto vacio no se manda", async () => {
    const { view, send } = setup();

    let outcome: unknown;
    act(() => {
      outcome = view.result.current.onSend("   ");
    });

    expect(send).not.toHaveBeenCalled();
    expect(await outcome).toMatchObject({ ok: false });
  });
});
