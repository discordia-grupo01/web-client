import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProfileFallback } from "./useProfileFallback";

const getPublicProfileRequest = vi.fn();

vi.mock("@/services/profile/client", () => ({
  getPublicProfileRequest: (...args: unknown[]) =>
    getPublicProfileRequest(...args),
}));

const embedded = {
  name: "Nova",
  avatar_url: "",
  description: "",
  status_text: "",
  status_emoji: "",
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useProfileFallback", () => {
  it("no pide nada si todos vienen con perfil", () => {
    const users = [{ user_id: "u1", profile: embedded }];

    const { result } = renderHook(() => useProfileFallback(users));

    expect(result.current).toEqual(users);
    expect(getPublicProfileRequest).not.toHaveBeenCalled();
  });

  it("completa con GET /users/:id solo a los que vienen con profile null", async () => {
    getPublicProfileRequest.mockResolvedValue({
      ok: true,
      user: { ...embedded, id: "u2", name: "Luna" },
    });
    const users = [
      { user_id: "u1", profile: embedded },
      { user_id: "u2", profile: null },
    ];

    const { result } = renderHook(() => useProfileFallback(users));

    await waitFor(() => expect(result.current?.[1].profile?.name).toBe("Luna"));
    expect(result.current?.[0].profile).toEqual(embedded);
    expect(getPublicProfileRequest).toHaveBeenCalledTimes(1);
    expect(getPublicProfileRequest).toHaveBeenCalledWith("u2");
  });

  it("si el pedido falla, el usuario queda sin perfil", async () => {
    getPublicProfileRequest.mockResolvedValue({ ok: false, message: "x" });
    const users = [{ user_id: "u2", profile: null }];

    const { result } = renderHook(() => useProfileFallback(users));

    await waitFor(() => expect(getPublicProfileRequest).toHaveBeenCalled());
    expect(result.current?.[0].profile).toBeNull();
  });

  it("no repite un pedido cuando la lista se actualiza", async () => {
    getPublicProfileRequest.mockResolvedValue({
      ok: true,
      user: { ...embedded, id: "u2" },
    });
    const first = [{ user_id: "u2", profile: null }];

    const { result, rerender } = renderHook(
      ({ list }) => useProfileFallback(list),
      { initialProps: { list: first } },
    );
    await waitFor(() => expect(result.current?.[0].profile).not.toBeNull());
    rerender({ list: [{ user_id: "u2", profile: null }] });

    expect(getPublicProfileRequest).toHaveBeenCalledTimes(1);
  });

  it("mientras la lista carga (null) devuelve null", () => {
    const { result } = renderHook(() => useProfileFallback(null));

    expect(result.current).toBeNull();
  });
});
