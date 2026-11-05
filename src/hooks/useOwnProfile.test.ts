import { type User } from "@discordia/client-shared";

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/profile/client", () => ({
  getOwnProfileRequest: vi.fn(),
}));

import { getOwnProfileRequest } from "@/services/profile/client";

import { OWN_PROFILE_FOCUS_REFRESH_MS, useOwnProfile } from "./useOwnProfile";

function user(premium: boolean): User {
  return {
    id: "u1",
    name: "Ana",
    email: "ana@example.com",
    description: "",
    avatar_url: "",
    status_text: "",
    status_emoji: "",
    premium,
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("useOwnProfile", () => {
  beforeEach(() => {
    vi.mocked(getOwnProfileRequest).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pide el perfil al montar", async () => {
    vi.mocked(getOwnProfileRequest).mockResolvedValue({
      ok: true,
      user: user(true),
    });

    const { result } = renderHook(() => useOwnProfile());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.profile?.premium).toBe(true);
  });

  it("refresh trae el premium nuevo", async () => {
    vi.mocked(getOwnProfileRequest)
      .mockResolvedValueOnce({ ok: true, user: user(true) })
      .mockResolvedValueOnce({ ok: true, user: user(false) });

    const { result } = renderHook(() => useOwnProfile());
    await waitFor(() => expect(result.current.profile?.premium).toBe(true));

    await act(() => result.current.refresh());

    expect(result.current.profile?.premium).toBe(false);
  });

  it("si el pedido falla conserva el perfil anterior", async () => {
    vi.mocked(getOwnProfileRequest)
      .mockResolvedValueOnce({ ok: true, user: user(true) })
      .mockResolvedValueOnce({ ok: false, message: "error" });

    const { result } = renderHook(() => useOwnProfile());
    await waitFor(() => expect(result.current.profile?.premium).toBe(true));

    await act(() => result.current.refresh());

    expect(result.current.profile?.premium).toBe(true);
  });

  it("al recuperar el foco vuelve a pedir solo si pasó el mínimo", async () => {
    vi.mocked(getOwnProfileRequest).mockResolvedValue({
      ok: true,
      user: user(false),
    });
    const now = vi.spyOn(Date, "now").mockReturnValue(0);

    const { result } = renderHook(() => useOwnProfile());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(getOwnProfileRequest).toHaveBeenCalledTimes(1);

    now.mockReturnValue(OWN_PROFILE_FOCUS_REFRESH_MS - 1);
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(getOwnProfileRequest).toHaveBeenCalledTimes(1);

    now.mockReturnValue(OWN_PROFILE_FOCUS_REFRESH_MS);
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() => expect(getOwnProfileRequest).toHaveBeenCalledTimes(2));

    now.mockRestore();
  });
});
