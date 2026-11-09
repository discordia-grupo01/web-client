import { NOTIFICATIONS_MARK_ALL_READ_FAILED } from "@discordia/client-shared";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMarkAllRead } from "@/hooks/useMarkAllRead";

function setup({
  unreadCount = 0,
  hasUnread = false,
  serverResult = Promise.resolve(true),
  hasUnreadDirect = false,
  directResult = Promise.resolve(true),
}: {
  unreadCount?: number;
  hasUnread?: boolean;
  serverResult?: Promise<boolean>;
  hasUnreadDirect?: boolean;
  directResult?: Promise<boolean>;
} = {}) {
  const reads = { unreadCount, markAllRead: vi.fn() };
  const unread = { hasUnread, markAllRead: vi.fn(() => serverResult) };
  const directMessages = {
    hasUnread: hasUnreadDirect,
    markAllRead: vi.fn(() => directResult),
  };
  const hook = renderHook(() =>
    useMarkAllRead({ reads, unread, directMessages }),
  );
  return { ...hook, reads, unread, directMessages };
}

describe("useMarkAllRead", () => {
  it("sin nada sin leer no se puede marcar", () => {
    const { result } = setup();
    expect(result.current.canMarkAllRead).toBe(false);
  });

  it("con canales sin leer se puede marcar aunque el centro este vacio", () => {
    const { result } = setup({ hasUnread: true });
    expect(result.current.canMarkAllRead).toBe(true);
  });

  it("con mensajes directos sin leer se puede marcar aunque el centro este vacio", () => {
    const { result } = setup({ hasUnreadDirect: true });
    expect(result.current.canMarkAllRead).toBe(true);
  });

  it("marca el historial, los canales y los mensajes directos", async () => {
    const { result, reads, unread, directMessages } = setup({
      unreadCount: 2,
      hasUnread: true,
      hasUnreadDirect: true,
    });

    await act(() => result.current.markAllRead());

    expect(reads.markAllRead).toHaveBeenCalledTimes(1);
    expect(unread.markAllRead).toHaveBeenCalledTimes(1);
    expect(directMessages.markAllRead).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it("si no hay nada sin leer en los servicios no les pregunta", async () => {
    const { result, reads, unread, directMessages } = setup({
      unreadCount: 2,
    });

    await act(() => result.current.markAllRead());

    expect(reads.markAllRead).toHaveBeenCalledTimes(1);
    expect(unread.markAllRead).not.toHaveBeenCalled();
    expect(directMessages.markAllRead).not.toHaveBeenCalled();
  });

  it("mientras espera al servidor no deja volver a marcar", async () => {
    let finish: (ok: boolean) => void = () => {};
    const { result } = setup({
      hasUnread: true,
      serverResult: new Promise((resolve) => (finish = resolve)),
    });

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.markAllRead();
    });
    expect(result.current.isMarkingAll).toBe(true);
    expect(result.current.canMarkAllRead).toBe(false);

    await act(async () => {
      finish(true);
      await pending;
    });
    expect(result.current.isMarkingAll).toBe(false);
  });

  it("si el servidor falla muestra el error", async () => {
    const { result } = setup({
      hasUnread: true,
      serverResult: Promise.resolve(false),
    });

    await act(() => result.current.markAllRead());

    expect(result.current.error).toBe(NOTIFICATIONS_MARK_ALL_READ_FAILED);
  });

  it("si fallan los mensajes directos muestra el error", async () => {
    const { result } = setup({
      hasUnread: true,
      hasUnreadDirect: true,
      directResult: Promise.resolve(false),
    });

    await act(() => result.current.markAllRead());

    expect(result.current.error).toBe(NOTIFICATIONS_MARK_ALL_READ_FAILED);
  });
});
