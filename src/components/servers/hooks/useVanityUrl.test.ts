import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setVanityCodeRequest } from "@/services/servers/client";

import { useVanityUrl } from "./useVanityUrl";

vi.mock("@/services/servers/client", () => ({
  setVanityCodeRequest: vi.fn(),
}));

const request = vi.mocked(setVanityCodeRequest);

describe("useVanityUrl", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("al guardar se queda con el código que devolvió servers", async () => {
    request.mockResolvedValue({ ok: true, vanity_code: "club-lectura" });
    const { result } = renderHook(() => useVanityUrl("s1", null));

    let saved = false;
    await act(async () => {
      saved = await result.current.save("Club-Lectura");
    });

    expect(saved).toBe(true);
    expect(request).toHaveBeenCalledWith("s1", "Club-Lectura");
    expect(result.current.savedCode).toBe("club-lectura");
  });

  it("si falla deja el mensaje y no cambia el código", async () => {
    request.mockResolvedValue({
      ok: false,
      message: "Ese link ya lo usa otro servidor. Probá con otro.",
    });
    const { result } = renderHook(() => useVanityUrl("s1", "viejo"));

    await act(async () => {
      await result.current.save("lectura");
    });

    expect(result.current.error).toBe(
      "Ese link ya lo usa otro servidor. Probá con otro.",
    );
    expect(result.current.savedCode).toBe("viejo");
  });

  it("toma el código nuevo si cambia el servidor", () => {
    const { result, rerender } = renderHook(
      ({ code }) => useVanityUrl("s1", code),
      { initialProps: { code: null as string | null } },
    );

    rerender({ code: "club-lectura" });

    expect(result.current.savedCode).toBe("club-lectura");
  });
});
