import type {
  UnreadSnapshotPayload,
  UnreadUpdatedPayload,
} from "@discordia/client-shared";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UnreadHandlers } from "@/services/notifications/socket";

const markRead = vi.fn();
const markAllRead = vi.fn(() => Promise.resolve(true));
const disconnect = vi.fn();
let handlers: UnreadHandlers;

vi.mock("@/services/notifications/socket", () => ({
  connectUnread: (_userId: string, next: UnreadHandlers) => {
    handlers = next;
    return { markRead, markAllRead, disconnect };
  },
}));

import { useUnreadState } from "@/components/home/hooks/useUnreadState";

const flags = (unread: boolean, mentionCount = 0) => ({
  unread,
  mention: mentionCount > 0,
  mention_count: mentionCount,
  notify: false,
  muted: false,
});

const snapshot: UnreadSnapshotPayload = {
  servers: [
    {
      server_id: "s1",
      ...flags(true, 1),
      channels: [
        { channel_id: "c1", ...flags(true) },
        { channel_id: "c2", ...flags(true, 1) },
      ],
    },
  ],
};

const update = (
  channelId: string,
  unread: boolean,
  mentionCount = 0,
): UnreadUpdatedPayload => ({
  server_id: "s1",
  channel_id: channelId,
  ...flags(unread, mentionCount),
  server: flags(unread, mentionCount),
});

describe("useUnreadState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra lo que trae el snapshot por canal y por servidor", () => {
    const { result } = renderHook(() => useUnreadState("me", null));
    act(() => handlers.snapshot(snapshot));

    expect(result.current.byChannel).toEqual({
      c1: { unread: true, mentionCount: 0 },
      c2: { unread: true, mentionCount: 1 },
    });
    expect(result.current.byServer.s1).toEqual({
      unread: true,
      mentionCount: 1,
    });
  });

  it("oculta lo de un servidor suspendido y lo devuelve al reactivarse", () => {
    const { result, rerender } = renderHook(
      ({ suspended }) => useUnreadState("me", null, suspended),
      { initialProps: { suspended: new Set(["s1"]) as ReadonlySet<string> } },
    );
    act(() => handlers.snapshot(snapshot));

    expect(result.current.byChannel).toEqual({});
    expect(result.current.byServer).toEqual({});

    rerender({ suspended: new Set() });

    expect(result.current.byServer.s1).toEqual({
      unread: true,
      mentionCount: 1,
    });
  });

  it("aplica los cambios que llegan en vivo", () => {
    const { result } = renderHook(() => useUnreadState("me", null));
    act(() => handlers.snapshot(snapshot));
    act(() => handlers.updated(update("c1", false)));

    expect(result.current.byChannel).not.toHaveProperty("c1");
    expect(markRead).not.toHaveBeenCalled();
  });

  it("abrir un canal lo apaga y avisa al back", () => {
    const { result, rerender } = renderHook(
      ({ open }) => useUnreadState("me", open),
      { initialProps: { open: null as string | null } },
    );
    act(() => handlers.snapshot(snapshot));
    rerender({ open: "c2" });

    expect(result.current.byChannel).not.toHaveProperty("c2");
    expect(result.current.byServer.s1).toEqual({
      unread: true,
      mentionCount: 0,
    });
    expect(markRead).toHaveBeenCalledWith("c2");
  });

  it("si el canal abierto se enciende, lo vuelve a marcar leído", () => {
    const { result } = renderHook(() => useUnreadState("me", "c1"));
    markRead.mockClear();
    act(() => handlers.updated(update("c1", true)));

    expect(result.current.byChannel).not.toHaveProperty("c1");
    expect(markRead).toHaveBeenCalledWith("c1");
  });

  it("si el snapshot trae el canal abierto, lo marca leído", () => {
    renderHook(() => useUnreadState("me", "c2"));
    markRead.mockClear();
    act(() => handlers.snapshot(snapshot));

    expect(markRead).toHaveBeenCalledWith("c2");
  });

  it("marcar todo apaga todos los canales y avisa al back", async () => {
    markAllRead.mockResolvedValue(true);
    const { result } = renderHook(() => useUnreadState("me", null));
    act(() => handlers.snapshot(snapshot));
    expect(result.current.hasUnread).toBe(true);

    let ok = false;
    await act(async () => {
      ok = await result.current.markAllRead();
    });

    expect(ok).toBe(true);
    expect(markAllRead).toHaveBeenCalledTimes(1);
    expect(result.current.byChannel).toEqual({});
    expect(result.current.hasUnread).toBe(false);
  });

  it("si marcar todo falla, los canales vuelven a aparecer", async () => {
    markAllRead.mockResolvedValue(false);
    const { result } = renderHook(() => useUnreadState("me", null));
    act(() => handlers.snapshot(snapshot));

    let ok = true;
    await act(async () => {
      ok = await result.current.markAllRead();
    });

    expect(ok).toBe(false);
    expect(Object.keys(result.current.byChannel)).toEqual(["c1", "c2"]);
  });

  it("al desmontar se desconecta", () => {
    const { unmount } = renderHook(() => useUnreadState("me", null));
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
