import type { Message } from "@discordia/client-shared";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFailedMessages } from "./useFailedMessages";

type SendResult = { ok: true } | { ok: false; message: string };

function msg(id: string): Message {
  return {
    id,
    channel_id: "c1",
    server_id: "",
    user_id: "ana",
    content: id,
    inserted_at: "2026-10-01T12:00:00.000Z",
  };
}

function setup(chatKey = "c1", lastMessageId: string | null = "m1") {
  const resolvers: ((result: SendResult) => void)[] = [];
  const send = vi.fn(
    () =>
      new Promise<SendResult>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  const view = renderHook(
    ({ chat }: { chat: string }) =>
      useFailedMessages({
        chatKey: chat,
        channelId: chat,
        currentUserId: "me",
        send,
        getLastMessageId: () => lastMessageId,
      }),
    { initialProps: { chat: chatKey } },
  );
  return { view, send, resolvers };
}

describe("useFailedMessages", () => {
  it("enviar texto devuelve void (el cuadro se limpia al instante) y no marca nada si sale bien", async () => {
    const { view, send, resolvers } = setup();

    let outcome: unknown = "sin llamar";
    act(() => {
      outcome = view.result.current.onSend("hola");
    });
    await act(async () => resolvers[0]({ ok: true }));

    expect(outcome).toBeUndefined();
    expect(send).toHaveBeenCalledWith("hola");
    expect(view.result.current.withFailed([msg("m1")])).toEqual([msg("m1")]);
  });

  it("si falla, queda marcado justo despues del mensaje que habia al enviar", async () => {
    const { view, resolvers } = setup();
    act(() => void view.result.current.onSend("hola"));
    await act(async () => resolvers[0]({ ok: false, message: "No se pudo" }));

    const shown = view.result.current.withFailed([msg("m1"), msg("m2")]);

    expect(shown.map((m) => m.id)).toEqual([
      "m1",
      expect.stringMatching(/^failed:/),
      "m2",
    ]);
    expect(shown[1]).toMatchObject({
      content: "hola",
      delivery: "failed",
      delivery_error: "No se pudo",
    });
  });

  it("al cambiar de chat el fallido desaparece y no vuelve", async () => {
    const { view, resolvers } = setup("c1");
    act(() => void view.result.current.onSend("hola"));
    await act(async () => resolvers[0]({ ok: false, message: "x" }));

    view.rerender({ chat: "c2" });
    expect(view.result.current.withFailed([msg("m1")])).toEqual([msg("m1")]);

    view.rerender({ chat: "c1" });
    expect(view.result.current.withFailed([msg("m1")])).toEqual([msg("m1")]);
  });

  it("un fallo que llega despues de cambiar de chat se pierde con el chat", async () => {
    const { view, resolvers } = setup("c1");
    act(() => void view.result.current.onSend("hola"));

    view.rerender({ chat: "c2" });
    await act(async () => resolvers[0]({ ok: false, message: "x" }));

    expect(view.result.current.withFailed([msg("m1")])).toEqual([msg("m1")]);
    view.rerender({ chat: "c1" });
    expect(view.result.current.withFailed([msg("m1")])).toEqual([msg("m1")]);
  });

  it("con adjuntos se envia como siempre y espera la respuesta", () => {
    const { view, send } = setup();

    let outcome: unknown;
    act(() => {
      outcome = view.result.current.onSend("foto", ["a1"]);
    });

    expect(outcome).toBeInstanceOf(Promise);
    expect(send).toHaveBeenCalledWith("foto", ["a1"]);
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
