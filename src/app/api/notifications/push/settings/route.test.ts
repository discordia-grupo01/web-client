import {
  PUSH_SETTINGS_LOAD_FAILED,
  PUSH_SETTINGS_SAVE_FAILED,
} from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const getPushSettings = vi.hoisted(() => vi.fn());
const updatePushSettings = vi.hoisted(() => vi.fn());
vi.mock("@/services/push/service", () => ({
  getPushSettings,
  updatePushSettings,
}));

import { GET, PUT } from "./route";

const withBody = (body: unknown) =>
  new Request("http://localhost/api/notifications/push/settings", {
    method: "PUT",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const failure = (status: number) => ({
  ok: false,
  status,
  code: status,
  message: "x",
});

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("GET /api/notifications/push/settings", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(getPushSettings).not.toHaveBeenCalled();
  });

  it("devuelve si el usuario recibe push", async () => {
    getPushSettings.mockResolvedValue({
      ok: true,
      status: 200,
      data: { enabled: false },
    });

    const response = await GET();

    expect(getPushSettings).toHaveBeenCalledWith("jwt");
    expect(await response.json()).toEqual({ ok: true, enabled: false });
  });

  it("traduce un 401 del back a 401", async () => {
    getPushSettings.mockResolvedValue(failure(401));

    expect((await GET()).status).toBe(401);
  });

  it("un fallo del servicio responde 502 con el mensaje del front", async () => {
    getPushSettings.mockResolvedValue(failure(503));

    const response = await GET();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: PUSH_SETTINGS_LOAD_FAILED,
    });
  });
});

describe("PUT /api/notifications/push/settings", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await PUT(withBody({ enabled: true }));

    expect(response.status).toBe(401);
    expect(updatePushSettings).not.toHaveBeenCalled();
  });

  it("guarda el interruptor y devuelve el estado resultante", async () => {
    updatePushSettings.mockResolvedValue({
      ok: true,
      status: 200,
      data: { enabled: false },
    });

    const response = await PUT(withBody({ enabled: false }));

    expect(updatePushSettings).toHaveBeenCalledWith("jwt", { enabled: false });
    expect(await response.json()).toEqual({ ok: true, enabled: false });
  });

  it.each([
    ["un body vacio", {}],
    ["un enabled que no es booleano", { enabled: "si" }],
    ["un body que no es JSON", "no es json"],
  ])("rechaza %s con 400 sin llamar al back", async (_name, body) => {
    const response = await PUT(withBody(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      message: PUSH_SETTINGS_SAVE_FAILED,
    });
    expect(updatePushSettings).not.toHaveBeenCalled();
  });

  it("conserva el 4xx del back y responde 502 ante un 5xx", async () => {
    updatePushSettings.mockResolvedValueOnce(failure(403));
    expect((await PUT(withBody({ enabled: true }))).status).toBe(403);

    updatePushSettings.mockResolvedValueOnce(failure(503));
    expect((await PUT(withBody({ enabled: true }))).status).toBe(502);
  });

  it("traduce un 401 del back a 401", async () => {
    updatePushSettings.mockResolvedValue(failure(401));

    expect((await PUT(withBody({ enabled: true }))).status).toBe(401);
  });
});
