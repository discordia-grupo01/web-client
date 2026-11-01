import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNow } from "./useNow";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-01T16:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useNow", () => {
  it("arranca con la hora actual aunque el modulo se haya cargado antes", () => {
    vi.setSystemTime(new Date("2026-11-01T17:00:00Z"));

    const { result, unmount } = renderHook(() => useNow());

    expect(result.current).toBe(Date.parse("2026-11-01T17:00:00Z"));
    unmount();
  });

  it("avanza cada segundo", () => {
    const { result, unmount } = renderHook(() => useNow());
    const start = result.current ?? 0;

    act(() => vi.advanceTimersByTime(3000));

    expect(result.current).toBe(start + 3000);
    unmount();
  });

  it("comparte un solo intervalo y lo apaga sin usuarios", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    const first = renderHook(() => useNow());
    const second = renderHook(() => useNow());
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    first.unmount();
    expect(clearIntervalSpy).not.toHaveBeenCalled();
    second.unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });
});
