import { NOTIFICATIONS_MARK_ALL_READ_FAILED } from "@discordia/client-shared";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMarkAllRead } from "@/hooks/useMarkAllRead";

function setup({
  unreadCount = 0,
  hasUnread = false,
  serverResult = Promise.resolve(true),
}: {
  unreadCount?: number;
  hasUnread?: boolean;
  serverResult?: Promise<boolean>;
} = {}) {
  const reads = { unreadCount, markAllRead: vi.fn() };
  const unread = { hasUnread, markAllRead: vi.fn(() => serverResult) };
  const hook = renderHook(() => useMarkAllRead({ reads, unread }));
  return { ...hook, reads, unread };
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

  it("marca el historial y los canales", async () => {
    const { result, reads, unread } = setup({
      unreadCount: 2,
      hasUnread: true,
    });

    await act(() => result.current.markAllRead());

    expect(reads.markAllRead).toHaveBeenCalledTimes(1);
    expect(unread.markAllRead).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it("si no hay canales sin leer no le pregunta al servidor", async () => {
    const { result, reads, unread } = setup({ unreadCount: 2 });

    await act(() => result.current.markAllRead());

    expect(reads.markAllRead).toHaveBeenCalledTimes(1);
    expect(unread.markAllRead).not.toHaveBeenCalled();
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
});
