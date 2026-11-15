import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const setVanityCode = vi.hoisted(() => vi.fn());
vi.mock("@/services/servers/service", () => ({ setVanityCode }));

import { PATCH } from "./route";

const params = { params: { serverId: "s1" } };

function patch(body: unknown) {
  return new Request("http://localhost/api/servers/s1/vanity", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("PATCH /api/servers/:id/vanity", () => {
  it("guarda el código y devuelve el que quedó", async () => {
    setVanityCode.mockResolvedValue({
      ok: true,
      status: 200,
      data: { vanity_code: "club-lectura" },
    });

    const response = await PATCH(patch({ code: "Club-Lectura" }), params);

    expect(setVanityCode).toHaveBeenCalledWith("jwt", "s1", "Club-Lectura");
    expect(await response.json()).toEqual({
      ok: true,
      vanity_code: "club-lectura",
    });
  });

  it("con null la quita", async () => {
    setVanityCode.mockResolvedValue({
      ok: true,
      status: 200,
      data: { vanity_code: null },
    });

    await PATCH(patch({ code: null }), params);

    expect(setVanityCode).toHaveBeenCalledWith("jwt", "s1", null);
  });

  it("rechaza un body sin código", async () => {
    const response = await PATCH(patch({}), params);

    expect(response.status).toBe(400);
    expect(setVanityCode).not.toHaveBeenCalled();
  });

  it("traduce el 409 de un código tomado", async () => {
    setVanityCode.mockResolvedValue({
      ok: false,
      status: 409,
      code: 409,
      message: "taken",
      details: { field: "code", reason: "vanity_code_taken" },
    });

    const response = await PATCH(patch({ code: "lectura" }), params);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      message: "Ese link ya lo usa otro servidor. Probá con otro.",
    });
  });
});
