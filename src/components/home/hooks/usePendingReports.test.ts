import { PENDING_REPORTS_POLL_MS } from "@discordia/client-shared";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePendingReports } from "@/components/home/hooks/usePendingReports";

describe("usePendingReports", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("pide el total de cada servidor al montar", async () => {
    const fetchCount = vi.fn(async (id: string) => ({
      total: id === "a" ? 3 : 0,
    }));
    const { result } = renderHook(() =>
      usePendingReports(["a", "b"], fetchCount),
    );

    await waitFor(() =>
      expect(result.current.byServer).toEqual({ a: 3, b: 0 }),
    );
  });

  it("un fallo conserva el ultimo valor conocido", async () => {
    let total: number | null = 2;
    const fetchCount = vi.fn(async () => ({ total }));
    const { result } = renderHook(() => usePendingReports(["a"], fetchCount));
    await waitFor(() => expect(result.current.byServer).toEqual({ a: 2 }));

    total = null;
    await act(() => result.current.refresh("a"));
    expect(result.current.byServer).toEqual({ a: 2 });
  });

  it("vuelve a pedir cada intervalo", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchCount = vi.fn(async () => ({ total: 1 }));
    renderHook(() => usePendingReports(["a"], fetchCount));
    await waitFor(() => expect(fetchCount).toHaveBeenCalledTimes(1));

    await act(async () => {
      vi.advanceTimersByTime(PENDING_REPORTS_POLL_MS);
    });
    expect(fetchCount).toHaveBeenCalledTimes(2);
  });

  it("sin servidores no pide nada", () => {
    const fetchCount = vi.fn(async () => ({ total: 0 }));
    renderHook(() => usePendingReports([], fetchCount));
    expect(fetchCount).not.toHaveBeenCalled();
  });
});
