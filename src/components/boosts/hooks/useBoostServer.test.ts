import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestBoostRequest = vi.fn();
const getBoostRequest = vi.fn();
const refreshes = vi.hoisted(() => ({
  current: null as null | (() => unknown),
  enabled: false,
}));

vi.mock("@/services/billing/client", () => ({
  requestBoostRequest: (...args: unknown[]) => requestBoostRequest(...args),
  getBoostRequest: (...args: unknown[]) => getBoostRequest(...args),
}));

vi.mock("@/hooks/useRefreshOnChange", () => ({
  useRefreshOnChange: (
    _filter: unknown,
    refresh: () => unknown,
    options: { enabled?: boolean },
  ) => {
    refreshes.current = refresh;
    refreshes.enabled = options.enabled ?? true;
  },
}));

import { changeBus } from "@/lib/changeBus";

import { useBoostServer } from "./useBoostServer";

const boost = (status: string) => ({
  id: "b1",
  server_id: "club",
  points: 100,
  status,
  status_detail: "",
  created_at: "2026-11-14T12:00:00Z",
  updated_at: "2026-11-14T12:00:00Z",
});

beforeEach(() => {
  vi.clearAllMocks();
  refreshes.current = null;
  refreshes.enabled = false;
});

describe("useBoostServer", () => {
  it("pide el boost y espera hasta que queda activo", async () => {
    requestBoostRequest.mockResolvedValue({ ok: true, data: boost("pending") });
    getBoostRequest.mockResolvedValue({ ok: true, data: boost("active") });
    const { result } = renderHook(() => useBoostServer("club"));

    await act(() => result.current.submit());

    expect(requestBoostRequest).toHaveBeenCalledWith(
      "club",
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );
    expect(result.current.flow.phase).toBe("waiting");
    expect(refreshes.enabled).toBe(true);

    await act(async () => {
      await refreshes.current?.();
    });

    expect(getBoostRequest).toHaveBeenCalledWith("b1");
    expect(result.current.flow).toMatchObject({
      phase: "done",
      request: { progress: { outcome: "applied", done: true } },
    });
    expect(refreshes.enabled).toBe(false);
  });

  it("avisa que el servidor cambió sin esperar al socket", async () => {
    requestBoostRequest.mockResolvedValue({ ok: true, data: boost("active") });
    const seen = vi.fn();
    const stop = changeBus.subscribe({ resources: ["server"] }, seen);
    const { result } = renderHook(() => useBoostServer("club"));

    await act(() => result.current.submit());
    stop();

    expect(seen).toHaveBeenCalledWith({
      resource: "server",
      server_id: "club",
    });
  });

  it("si no alcanzan los puntos vuelve al inicio con el error", async () => {
    requestBoostRequest.mockResolvedValue({
      ok: false,
      code: "INSUFFICIENT_POINTS",
      message: "Te faltan 60 puntos para boostear este servidor.",
    });
    const { result } = renderHook(() => useBoostServer("club"));

    await act(() => result.current.submit());

    expect(result.current.flow.phase).toBe("idle");
    expect(result.current.error).toBe(
      "Te faltan 60 puntos para boostear este servidor.",
    );
  });

  it("usa una clave nueva para el boost siguiente", async () => {
    requestBoostRequest.mockResolvedValue({ ok: true, data: boost("active") });
    const { result } = renderHook(() => useBoostServer("club"));

    await act(() => result.current.submit());
    act(() => result.current.reset());
    await act(() => result.current.submit());

    const [first, second] = requestBoostRequest.mock.calls.map(
      (call) => call[1],
    );
    expect(first).not.toBe(second);
  });
});
