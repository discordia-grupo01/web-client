import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useProfileChanges } from "@/hooks/useProfileChanges";
import { changeBus } from "@/lib/changeBus";

const getPublicProfileRequest = vi.fn();

vi.mock("@/services/profile/client", () => ({
  getPublicProfileRequest: (userId: string) => getPublicProfileRequest(userId),
}));

const user = (id: string, name: string) => ({
  ok: true,
  user: { id, name, avatar_url: "" },
});

describe("useProfileChanges", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getPublicProfileRequest.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("vuelve a pedir el perfil de quien está en la caché y lo aplica", async () => {
    getPublicProfileRequest.mockResolvedValue(user("u1", "Nuevo"));
    const apply = vi.fn();
    renderHook(() => useProfileChanges((id) => id === "u1", apply));

    act(() => changeBus.publish({ resource: "profile", user_id: "u1" }));
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(getPublicProfileRequest).toHaveBeenCalledWith("u1");
    expect(apply).toHaveBeenCalledWith({
      id: "u1",
      name: "Nuevo",
      avatar_url: "",
    });
  });

  it("ignora a quien no está en la caché y los avisos sin usuario", async () => {
    const apply = vi.fn();
    renderHook(() => useProfileChanges((id) => id === "u1", apply));

    act(() => changeBus.publish({ resource: "profile", user_id: "u2" }));
    act(() => changeBus.publish({ resource: "profile" }));
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(getPublicProfileRequest).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });

  it("junta los avisos repetidos de varios servidores en un solo pedido", async () => {
    getPublicProfileRequest.mockResolvedValue(user("u1", "Nuevo"));
    renderHook(() => useProfileChanges(() => true, vi.fn()));

    act(() => {
      changeBus.publish({
        resource: "profile",
        user_id: "u1",
        server_id: "s1",
      });
      changeBus.publish({
        resource: "profile",
        user_id: "u1",
        server_id: "s2",
      });
    });
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(getPublicProfileRequest).toHaveBeenCalledTimes(1);
  });

  it("no aplica nada si el pedido falla", async () => {
    getPublicProfileRequest.mockResolvedValue({ ok: false, message: "x" });
    const apply = vi.fn();
    renderHook(() => useProfileChanges(() => true, apply));

    act(() => changeBus.publish({ resource: "profile", user_id: "u1" }));
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(apply).not.toHaveBeenCalled();
  });
});
