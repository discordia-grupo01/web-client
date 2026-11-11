import type { NotificationHistoryItem } from "@discordia/client-shared";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNotificationReads } from "@/hooks/useNotificationReads";

const KEY = "discordia:notification-reads:u1";

const mention = (
  messageId: string,
  channelId: string,
  at: string,
): NotificationHistoryItem => ({
  kind: "mention",
  message_id: messageId,
  author_id: "ana",
  occurred_at: at,
  server_id: "s1",
  channel_id: channelId,
  conversation_id: null,
});

const direct = (messageId: string, at: string): NotificationHistoryItem => ({
  kind: "direct_message",
  message_id: messageId,
  author_id: "beto",
  occurred_at: at,
  server_id: null,
  channel_id: null,
  conversation_id: "conv-1",
});

const stored = () => JSON.parse(localStorage.getItem(KEY) ?? "{}");

describe("useNotificationReads", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-02T12:10:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const items = [
    mention("m3", "c1", "2026-11-02T12:00:03Z"),
    direct("m2", "2026-11-02T12:00:02Z"),
    mention("m1", "c2", "2026-11-02T12:00:01Z"),
  ];

  it("sin marcas todo cuenta como sin leer", () => {
    const { result } = renderHook(() => useNotificationReads("u1", items));

    expect(result.current.unreadCount).toBe(3);
  });

  it("abrir un canal deja leido lo de ese canal y nada mas", () => {
    const { result } = renderHook(() => useNotificationReads("u1", items));

    act(() => result.current.markChannelRead("c1"));

    expect(result.current.unreadCount).toBe(2);
    expect(Object.keys(stored())).toEqual(["channel:c1"]);
  });

  it("abrir una conversacion deja leidos sus mensajes directos", () => {
    const { result } = renderHook(() => useNotificationReads("u1", items));

    act(() => result.current.markConversationRead("conv-1"));

    expect(result.current.unreadCount).toBe(2);
    expect(Object.keys(stored())).toEqual(["dm:conv-1"]);
  });

  it("marcar todo deja todo leido", () => {
    const { result } = renderHook(() => useNotificationReads("u1", items));

    act(() => result.current.markAllRead());

    expect(result.current.unreadCount).toBe(0);
    expect(Object.keys(stored())).toEqual(["*"]);
  });

  it("lo que llega despues de leer vuelve a contar", () => {
    const { result, rerender } = renderHook(
      ({ list }) => useNotificationReads("u1", list),
      { initialProps: { list: items } },
    );
    act(() => result.current.markAllRead());
    expect(result.current.unreadCount).toBe(0);

    vi.setSystemTime(new Date("2026-11-02T12:20:00.000Z"));
    rerender({
      list: [mention("m4", "c1", "2026-11-02T12:15:00Z"), ...items],
    });

    expect(result.current.unreadCount).toBe(1);
  });

  it("recuerda lo leido entre sesiones", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ "channel:c1": "2026-11-03T00:00:00.000Z" }),
    );

    const { result } = renderHook(() => useNotificationReads("u1", items));

    expect(result.current.unreadCount).toBe(2);
  });

  it("cada usuario tiene sus propias marcas", () => {
    localStorage.setItem(
      "discordia:notification-reads:u2",
      JSON.stringify({ "channel:c1": "2026-11-03T00:00:00.000Z" }),
    );

    const { result } = renderHook(() => useNotificationReads("u1", items));

    expect(result.current.unreadCount).toBe(3);
  });

  it("marcar todo tambien deja leido lo que todavia no se cargo", () => {
    const { result, rerender } = renderHook(
      ({ list }) => useNotificationReads("u1", list),
      { initialProps: { list: items } },
    );
    act(() => result.current.markAllRead());

    rerender({
      list: [...items, mention("viejo", "c9", "2026-11-01T08:00:00Z")],
    });

    expect(result.current.unreadCount).toBe(0);
  });

  it("sin usuario no cuenta como leido ni guarda nada", () => {
    const { result } = renderHook(() => useNotificationReads(null, items));

    act(() => result.current.markAllRead());

    expect(result.current.unreadCount).toBe(3);
    expect(localStorage.length).toBe(0);
  });

  it("volver a abrir lo ya leido no cambia lo guardado de mas", () => {
    const { result } = renderHook(() => useNotificationReads("u1", items));
    act(() => result.current.markChannelRead("c1"));
    const first = localStorage.getItem(KEY);

    vi.setSystemTime(new Date("2026-11-02T12:10:00.000Z"));
    act(() => result.current.markChannelRead("c1"));

    expect(localStorage.getItem(KEY)).toBe(first);
  });
  describe("con el estado de lectura de messaging", () => {
    it("lo que messaging da por leido no cuenta aunque no tenga marca propia", () => {
      const { result } = renderHook(() =>
        useNotificationReads(
          "u1",
          items,
          (entry) => entry.kind === "direct_message",
        ),
      );

      expect(result.current.unreadCount).toBe(1);
      expect(result.current.isUnread(items[1])).toBe(true);
      expect(result.current.isUnread(items[0])).toBe(false);
    });

    it("para estar sin leer tienen que coincidir las dos fuentes", () => {
      const { result } = renderHook(() =>
        useNotificationReads("u1", items, () => true),
      );
      expect(result.current.unreadCount).toBe(3);

      act(() => result.current.markChannelRead("c1"));

      expect(result.current.unreadCount).toBe(2);
    });

    it("sin datos de messaging todo cuenta como sin leer", () => {
      const { result } = renderHook(() => useNotificationReads("u1", items));

      expect(result.current.unreadCount).toBe(3);
    });
  });

  it("responder o tocar una transferencia la deja leida sin tocar lo demas", () => {
    const transfer: NotificationHistoryItem = {
      kind: "ownership_transfer",
      message_id: "t1",
      author_id: "owner",
      to_user_id: "u1",
      transfer_status: "pending",
      occurred_at: "2026-11-02T12:00:04Z",
      server_id: "s1",
      channel_id: null,
      conversation_id: null,
    };
    const all = [transfer, ...items];
    const { result } = renderHook(() => useNotificationReads("u1", all));
    expect(result.current.unreadCount).toBe(4);

    act(() => result.current.markTransferRead("t1"));

    expect(result.current.isUnread(transfer)).toBe(false);
    expect(result.current.unreadCount).toBe(3);
    expect(stored()).toHaveProperty(["transfer:t1"]);
  });
});
