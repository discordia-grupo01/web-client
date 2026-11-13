import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChallengeCountdown } from "./useChallengeCountdown";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useChallengeCountdown", () => {
  it("arranca con el tiempo que mandó el back y lo descuenta", async () => {
    const { result } = renderHook(() => useChallengeCountdown(125, vi.fn()));

    expect(result.current).toBe(125);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current).toBe(120);
  });

  it("al llegar a cero avisa que venció, sin esperar al back", async () => {
    const onExpired = vi.fn();
    renderHook(() => useChallengeCountdown(2, onExpired));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("si llega vencido avisa enseguida", () => {
    const onExpired = vi.fn();
    renderHook(() => useChallengeCountdown(0, onExpired));

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("detenido no descuenta ni avisa", async () => {
    const onExpired = vi.fn();
    const { result } = renderHook(() =>
      useChallengeCountdown(2, onExpired, false),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current).toBe(2);
    expect(onExpired).not.toHaveBeenCalled();
  });
});
