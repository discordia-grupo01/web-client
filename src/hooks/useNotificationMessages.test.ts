import type {
  Message,
  NotificationHistoryItem,
} from "@discordia/client-shared";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const lookupMessagesRequest = vi.fn();

vi.mock("@/services/messages/client", () => ({
  lookupMessagesRequest: (...args: unknown[]) => lookupMessagesRequest(...args),
}));

import { useNotificationMessages } from "@/hooks/useNotificationMessages";

const item = (messageId: string): NotificationHistoryItem => ({
  kind: "mention",
  message_id: messageId,
  author_id: "ana",
  occurred_at: "2026-11-02T12:00:00Z",
  server_id: "s1",
  channel_id: "c1",
  conversation_id: null,
});

const stored = (id: string): Message =>
  ({ id, content: `texto ${id}` }) as Message;

describe("useNotificationMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trae el texto de todas las notificaciones en un solo pedido", async () => {
    lookupMessagesRequest.mockResolvedValue({
      ok: true,
      messages: [stored("m1"), stored("m2")],
    });

    const { result } = renderHook(() =>
      useNotificationMessages([item("m2"), item("m1")]),
    );

    await waitFor(() => expect(Object.keys(result.current)).toHaveLength(2));
    expect(lookupMessagesRequest).toHaveBeenCalledTimes(1);
    expect(lookupMessagesRequest).toHaveBeenCalledWith(["m2", "m1"]);
    expect(result.current.m1?.content).toBe("texto m1");
  });

  it("un mensaje que el back no devuelve queda como no disponible", async () => {
    lookupMessagesRequest.mockResolvedValue({
      ok: true,
      messages: [stored("m1")],
    });

    const { result } = renderHook(() =>
      useNotificationMessages([item("m1"), item("m2")]),
    );

    await waitFor(() => expect(result.current.m2).toBeNull());
    expect(result.current.m1).not.toBeNull();
  });

  it("solo pide lo que todavia no pidio", async () => {
    lookupMessagesRequest.mockResolvedValue({
      ok: true,
      messages: [stored("m1")],
    });

    const { result, rerender } = renderHook(
      ({ items }) => useNotificationMessages(items),
      { initialProps: { items: [item("m1")] } },
    );
    await waitFor(() => expect(result.current.m1).toBeDefined());

    lookupMessagesRequest.mockResolvedValue({
      ok: true,
      messages: [stored("m2")],
    });
    rerender({ items: [item("m2"), item("m1")] });

    await waitFor(() => expect(result.current.m2).toBeDefined());
    expect(lookupMessagesRequest).toHaveBeenLastCalledWith(["m2"]);
    expect(lookupMessagesRequest).toHaveBeenCalledTimes(2);
  });

  it("parte en tandas de 50 lo que excede el maximo del back", async () => {
    lookupMessagesRequest.mockResolvedValue({ ok: true, messages: [] });
    const items = Array.from({ length: 51 }, (_, index) => item(`m${index}`));

    renderHook(() => useNotificationMessages(items));

    await waitFor(() => expect(lookupMessagesRequest).toHaveBeenCalledTimes(2));
    expect(lookupMessagesRequest.mock.calls.map(([ids]) => ids.length)).toEqual(
      [50, 1],
    );
  });

  it("si el pedido falla no marca nada y lo reintenta en la proxima carga", async () => {
    lookupMessagesRequest.mockResolvedValueOnce({ ok: false, message: "x" });

    const { result, rerender } = renderHook(
      ({ items }) => useNotificationMessages(items),
      { initialProps: { items: [item("m1")] } },
    );
    await waitFor(() => expect(lookupMessagesRequest).toHaveBeenCalledTimes(1));
    expect(result.current).toEqual({});

    lookupMessagesRequest.mockResolvedValue({
      ok: true,
      messages: [stored("m1")],
    });
    rerender({ items: [item("m1"), item("m0")] });

    await waitFor(() => expect(result.current.m1).toBeDefined());
  });

  it("sin notificaciones no pide nada", () => {
    renderHook(() => useNotificationMessages([]));

    expect(lookupMessagesRequest).not.toHaveBeenCalled();
  });
});
