import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DOUBLE_TAP_MS, useTapOrDoubleTap } from "./useTapOrDoubleTap";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useTapOrDoubleTap", () => {
  it("un toque solo hace la accion simple, un rato despues", () => {
    const onTap = vi.fn();
    const onDoubleTap = vi.fn();
    const { result } = renderHook(() => useTapOrDoubleTap(onTap, onDoubleTap));

    act(() => result.current());
    expect(onTap).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(DOUBLE_TAP_MS));
    expect(onTap).toHaveBeenCalledOnce();
    expect(onDoubleTap).not.toHaveBeenCalled();
  });

  it("dos toques seguidos hacen solo la accion doble", () => {
    const onTap = vi.fn();
    const onDoubleTap = vi.fn();
    const { result } = renderHook(() => useTapOrDoubleTap(onTap, onDoubleTap));

    act(() => {
      result.current();
      vi.advanceTimersByTime(DOUBLE_TAP_MS - 50);
      result.current();
    });
    act(() => vi.advanceTimersByTime(DOUBLE_TAP_MS));

    expect(onDoubleTap).toHaveBeenCalledOnce();
    expect(onTap).not.toHaveBeenCalled();
  });

  it("sin accion doble el toque se atiende enseguida", () => {
    const onTap = vi.fn();
    const { result } = renderHook(() => useTapOrDoubleTap(onTap, undefined));

    act(() => result.current());

    expect(onTap).toHaveBeenCalledOnce();
  });

  it("no hace nada si se desmonta antes de que pase el tiempo", () => {
    const onTap = vi.fn();
    const { result, unmount } = renderHook(() =>
      useTapOrDoubleTap(onTap, vi.fn()),
    );

    act(() => result.current());
    unmount();
    act(() => vi.advanceTimersByTime(DOUBLE_TAP_MS));

    expect(onTap).not.toHaveBeenCalled();
  });
});
