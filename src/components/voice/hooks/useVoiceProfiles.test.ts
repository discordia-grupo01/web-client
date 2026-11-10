import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { avatarSrcOf } from "@/utils/userProfile";

import { useVoiceProfiles } from "./useVoiceProfiles";

const getPublicProfileRequest = vi.fn();

vi.mock("@/services/profile/client", () => ({
  getPublicProfileRequest: (...args: unknown[]) =>
    getPublicProfileRequest(...args),
}));

function publicProfile(id: string, avatarUrl: string) {
  return {
    ok: true,
    user: {
      id,
      name: `Nombre ${id}`,
      avatar_url: avatarUrl,
      description: "",
      status_text: "",
      status_emoji: "",
    },
  };
}

beforeEach(() => {
  getPublicProfileRequest.mockReset();
  getPublicProfileRequest.mockImplementation(async (id: string) =>
    publicProfile(id, `https://cdn/${id}.png?v=1`),
  );
});

describe("useVoiceProfiles", () => {
  it("resuelve la foto de cada participante", async () => {
    const { result } = renderHook(() => useVoiceProfiles(["u-ana"]));

    await waitFor(() =>
      expect(result.current.avatarSrcOf("u-ana")).toBe(
        avatarSrcOf("u-ana", {
          name: "Nombre u-ana",
          avatar_url: "https://cdn/u-ana.png?v=1",
        }),
      ),
    );
  });

  it("el tile de pantalla compartida usa la foto del dueño", async () => {
    const { result } = renderHook(() => useVoiceProfiles(["u-beto"]));

    await waitFor(() =>
      expect(result.current.avatarSrcOf("u-beto:screen")).toBe(
        result.current.avatarSrcOf("u-beto"),
      ),
    );
    expect(result.current.avatarSrcOf("u-beto")).not.toBeNull();
  });

  it("pide una sola vez por id aunque lo usen varias pantallas", async () => {
    const sidebar = renderHook(() => useVoiceProfiles(["u-caro"]));
    const grid = renderHook(() => useVoiceProfiles(["u-caro"]));

    await waitFor(() =>
      expect(grid.result.current.avatarSrcOf("u-caro")).not.toBeNull(),
    );
    expect(sidebar.result.current.avatarSrcOf("u-caro")).not.toBeNull();
    expect(getPublicProfileRequest).toHaveBeenCalledTimes(1);
  });

  it("sin foto en el perfil devuelve null (se ve la inicial)", async () => {
    getPublicProfileRequest.mockImplementation(async (id: string) =>
      publicProfile(id, ""),
    );
    const { result } = renderHook(() => useVoiceProfiles(["u-dani"]));

    await waitFor(() => expect(result.current.profiles).toHaveLength(1));
    expect(result.current.avatarSrcOf("u-dani")).toBeNull();
  });

  it("si falla, reintenta cuando cambia quien esta en voz", async () => {
    getPublicProfileRequest.mockResolvedValueOnce({
      ok: false,
      message: "error",
    });
    const { result, rerender } = renderHook(
      ({ ids }) => useVoiceProfiles(ids),
      { initialProps: { ids: ["u-eli"] } },
    );

    await waitFor(() =>
      expect(getPublicProfileRequest).toHaveBeenCalledTimes(1),
    );
    expect(result.current.avatarSrcOf("u-eli")).toBeNull();

    rerender({ ids: ["u-eli", "u-fede"] });

    await waitFor(() =>
      expect(result.current.avatarSrcOf("u-eli")).not.toBeNull(),
    );
    expect(result.current.avatarSrcOf("u-fede")).not.toBeNull();
  });
});
