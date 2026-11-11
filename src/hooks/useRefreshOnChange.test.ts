import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { changeBus } from "@/lib/changeBus";

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useRefreshOnChange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("recarga cuando llega un aviso de ese recurso y servidor", async () => {
    const refresh = vi.fn();
    renderHook(() =>
      useRefreshOnChange({ resources: ["members"], serverId: "s1" }, refresh),
    );
    act(() => changeBus.publish({ resource: "members", server_id: "s2" }));
    act(() => changeBus.publish({ resource: "roles", server_id: "s1" }));
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(refresh).not.toHaveBeenCalled();

    act(() => changeBus.publish({ resource: "members", server_id: "s1" }));
    act(() => changeBus.publish({ resource: "members", server_id: "s1" }));
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("recarga cada tanto como red de seguridad", async () => {
    const refresh = vi.fn();
    renderHook(() =>
      useRefreshOnChange({ resources: ["members"] }, refresh, {
        pollMs: 1000,
      }),
    );
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("no recarga con la pestaña oculta y lo hace al volver", async () => {
    const refresh = vi.fn();
    renderHook(() =>
      useRefreshOnChange({ resources: ["members"] }, refresh, {
        pollMs: 1000,
      }),
    );
    setVisibility("hidden");
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(refresh).not.toHaveBeenCalled();

    setVisibility("visible");
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("sin pollMs solo reacciona a los avisos", async () => {
    const refresh = vi.fn();
    renderHook(() =>
      useRefreshOnChange({ resources: ["members"] }, refresh, {
        pollMs: null,
      }),
    );
    await act(() => vi.advanceTimersByTimeAsync(120_000));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("deja de escuchar al desmontar o al deshabilitarse", async () => {
    const refresh = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ enabled }) =>
        useRefreshOnChange({ resources: ["members"] }, refresh, { enabled }),
      { initialProps: { enabled: false } },
    );
    act(() => changeBus.publish({ resource: "members" }));
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(refresh).not.toHaveBeenCalled();

    rerender({ enabled: true });
    unmount();
    act(() => changeBus.publish({ resource: "members" }));
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("usa siempre la última función de recarga", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ fn }) => useRefreshOnChange({ resources: ["members"] }, fn),
      { initialProps: { fn: first } },
    );
    rerender({ fn: second });
    act(() => changeBus.publish({ resource: "members" }));
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("espera delayMs antes de recargar", async () => {
    const refresh = vi.fn();
    renderHook(() =>
      useRefreshOnChange({ resources: ["profile"] }, refresh, {
        pollMs: null,
        delayMs: 2000,
      }),
    );
    act(() => changeBus.publish({ resource: "profile", user_id: "u1" }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(refresh).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
