import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyChannelPermissionsRequest } from "./client";
import { useMyChannelPermissions } from "./useChannelOverrides";

vi.mock("./client", () => ({
  getMyChannelPermissionsRequest: vi.fn(),
}));

const getMine = vi.mocked(getMyChannelPermissionsRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMyChannelPermissions", () => {
  it("sin canal no hay nada que esperar", () => {
    const { result } = renderHook(() => useMyChannelPermissions(null));
    expect(result.current).toEqual({ status: "unknown" });
    expect(getMine).not.toHaveBeenCalled();
  });

  it("esta cargando hasta que llegan los permisos del canal", async () => {
    getMine.mockResolvedValue({ ok: true, permissions: ["VIEW_CHANNELS"] });
    const { result } = renderHook(() => useMyChannelPermissions("ch1"));

    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() =>
      expect(result.current).toEqual({
        status: "loaded",
        permissions: ["VIEW_CHANNELS"],
      }),
    );
  });

  it("vuelve a cargando al cambiar de canal, sin arrastrar los del anterior", async () => {
    getMine.mockResolvedValueOnce({
      ok: true,
      permissions: ["VIEW_CHANNELS", "CONNECT"],
    });
    const { result, rerender } = renderHook(
      ({ channelId }) => useMyChannelPermissions(channelId),
      { initialProps: { channelId: "ch1" } },
    );
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    getMine.mockReturnValueOnce(new Promise(() => {}));
    rerender({ channelId: "ch2" });
    expect(result.current).toEqual({ status: "loading" });
  });

  it("si falla el pedido queda en unknown para usar los del servidor", async () => {
    getMine.mockResolvedValue({ ok: false, message: "error" });
    const { result } = renderHook(() => useMyChannelPermissions("ch1"));

    await waitFor(() => expect(result.current).toEqual({ status: "unknown" }));
  });

  it("un fallo al refrescar mantiene lo que ya sabia del canal", async () => {
    getMine.mockResolvedValueOnce({ ok: true, permissions: ["CONNECT"] });
    const { result } = renderHook(() => useMyChannelPermissions("ch1"));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    getMine.mockResolvedValueOnce({ ok: false, message: "error" });
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => expect(getMine).toHaveBeenCalledTimes(2));
    expect(result.current).toEqual({
      status: "loaded",
      permissions: ["CONNECT"],
    });
  });
});
