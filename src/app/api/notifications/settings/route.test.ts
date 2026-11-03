import { NOTIFICATION_SETTINGS_LOAD_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const getNotificationSettings = vi.hoisted(() => vi.fn());
vi.mock("@/services/notifications/service", () => ({
  getNotificationSettings,
}));

import { GET } from "./route";

const LISTING = {
  servers: ["s1"],
  channels: [{ channel_id: "c1", server_id: "s2" }],
  preferences: {
    servers: [{ server_id: "s3", level: "all" }],
    channels: [{ channel_id: "c2", server_id: "s3", level: "none" }],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("GET /api/notifications/settings", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(getNotificationSettings).not.toHaveBeenCalled();
  });

  it("devuelve lo que silencio y configuro el usuario", async () => {
    getNotificationSettings.mockResolvedValue({
      ok: true,
      status: 200,
      data: LISTING,
    });

    const response = await GET();

    expect(getNotificationSettings).toHaveBeenCalledWith("jwt");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, ...LISTING });
  });

  it("traduce un 401 del back a 401", async () => {
    getNotificationSettings.mockResolvedValue({
      ok: false,
      status: 401,
      code: 401,
      message: "x",
    });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("un fallo del servicio responde 502 con el mensaje del front", async () => {
    getNotificationSettings.mockResolvedValue({
      ok: false,
      status: 503,
      code: 503,
      message: "x",
    });

    const response = await GET();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: NOTIFICATION_SETTINGS_LOAD_FAILED,
    });
  });
});
