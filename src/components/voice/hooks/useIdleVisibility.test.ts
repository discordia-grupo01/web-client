import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IDLE_HIDE_MS, useIdleVisibility } from "./useIdleVisibility";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useIdleVisibility", () => {
  it("desactivado siempre se ve", () => {
    const { result } = renderHook(() => useIdleVisibility(false));

    act(() => vi.advanceTimersByTime(IDLE_HIDE_MS * 2));

    expect(result.current.isVisible).toBe(true);
  });

  it("se ve al activarse y se oculta sin actividad", () => {
    const { result } = renderHook(() => useIdleVisibility(true));
    expect(result.current.isVisible).toBe(true);

    act(() => vi.advanceTimersByTime(IDLE_HIDE_MS));

    expect(result.current.isVisible).toBe(false);
  });

  it("la actividad lo muestra y reinicia la espera", () => {
    const { result } = renderHook(() => useIdleVisibility(true));
    act(() => vi.advanceTimersByTime(IDLE_HIDE_MS));

    act(() => result.current.onActivity());
    expect(result.current.isVisible).toBe(true);

    act(() => vi.advanceTimersByTime(IDLE_HIDE_MS - 1));
    act(() => result.current.onActivity());
    act(() => vi.advanceTimersByTime(IDLE_HIDE_MS - 1));
    expect(result.current.isVisible).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.isVisible).toBe(false);
  });

  it("al desactivarse y volver a activarse arranca visible", () => {
    const { result, rerender } = renderHook(
      ({ isEnabled }) => useIdleVisibility(isEnabled),
      { initialProps: { isEnabled: true } },
    );
    act(() => vi.advanceTimersByTime(IDLE_HIDE_MS));

    rerender({ isEnabled: false });
    rerender({ isEnabled: true });

    expect(result.current.isVisible).toBe(true);
  });
});
