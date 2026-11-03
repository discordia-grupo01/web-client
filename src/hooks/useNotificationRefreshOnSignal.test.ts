import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNotificationRefreshOnSignal } from "@/hooks/useNotificationRefreshOnSignal";

const DELAYS = [1_000, 2_000, 3_000];

describe("useNotificationRefreshOnSignal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function advance(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  it("sin senal no pide nada", async () => {
    const refresh = vi.fn().mockResolvedValue(false);

    renderHook(() => useNotificationRefreshOnSignal(0, refresh, DELAYS));
    await advance(10_000);

    expect(refresh).not.toHaveBeenCalled();
  });

  it("con una senal pide a la primera espera", async () => {
    const refresh = vi.fn().mockResolvedValue(true);

    renderHook(() => useNotificationRefreshOnSignal(1, refresh, DELAYS));
    await advance(999);
    expect(refresh).not.toHaveBeenCalled();

    await advance(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("se detiene en cuanto aparece lo nuevo", async () => {
    const refresh = vi.fn().mockResolvedValue(true);

    renderHook(() => useNotificationRefreshOnSignal(1, refresh, DELAYS));
    await advance(10_000);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("reintenta con las esperas indicadas mientras no aparezca", async () => {
    const refresh = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    renderHook(() => useNotificationRefreshOnSignal(1, refresh, DELAYS));

    await advance(1_000);
    expect(refresh).toHaveBeenCalledTimes(1);
    await advance(1_999);
    expect(refresh).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(refresh).toHaveBeenCalledTimes(2);
    await advance(3_000);
    expect(refresh).toHaveBeenCalledTimes(3);
    await advance(10_000);
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("no pide mas veces que esperas hay", async () => {
    const refresh = vi.fn().mockResolvedValue(false);

    renderHook(() => useNotificationRefreshOnSignal(1, refresh, DELAYS));
    await advance(60_000);

    expect(refresh).toHaveBeenCalledTimes(DELAYS.length);
  });

  it("una senal nueva empieza de cero", async () => {
    const refresh = vi.fn().mockResolvedValue(false);

    const { rerender } = renderHook(
      ({ signal }) => useNotificationRefreshOnSignal(signal, refresh, DELAYS),
      { initialProps: { signal: 1 } },
    );
    await advance(1_000);
    expect(refresh).toHaveBeenCalledTimes(1);

    rerender({ signal: 2 });
    await advance(999);
    expect(refresh).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("al desmontar cancela los reintentos pendientes", async () => {
    const refresh = vi.fn().mockResolvedValue(false);

    const { unmount } = renderHook(() =>
      useNotificationRefreshOnSignal(1, refresh, DELAYS),
    );
    await advance(1_000);
    unmount();
    await advance(60_000);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("usa la version mas reciente de refresh", async () => {
    const first = vi.fn().mockResolvedValue(false);
    const second = vi.fn().mockResolvedValue(true);

    const { rerender } = renderHook(
      ({ refresh }) => useNotificationRefreshOnSignal(1, refresh, DELAYS),
      { initialProps: { refresh: first } },
    );
    rerender({ refresh: second });
    await advance(1_000);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
