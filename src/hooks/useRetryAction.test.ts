import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRetryAction } from "./useRetryAction";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useRetryAction", () => {
  it("mientras espera la respuesta esta reintentando, y despues vuelve a estar libre", async () => {
    let finish: () => void = () => {};
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => useRetryAction(action));
    expect(result.current.isRetrying).toBe(false);

    act(() => void result.current.run());
    expect(result.current.isRetrying).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(result.current.isRetrying).toBe(true);

    await act(async () => finish());
    expect(result.current.isRetrying).toBe(false);
  });

  it("si responde al instante igual se ve un momento, para que se note que paso algo", async () => {
    const { result } = renderHook(() => useRetryAction(() => undefined));

    act(() => void result.current.run());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(599);
    });
    expect(result.current.isRetrying).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.isRetrying).toBe(false);
  });

  it("si el reintento falla, tambien termina", async () => {
    const { result } = renderHook(() =>
      useRetryAction(() => Promise.reject(new Error("sin red"))),
    );

    await act(async () => {
      await result.current.run().catch(() => undefined);
    });

    expect(result.current.isRetrying).toBe(false);
  });
});
