import { NOTIFICATION_SETTINGS_SAVE_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const updateChannelNotificationSettings = vi.hoisted(() => vi.fn());
vi.mock("@/services/notifications/service", () => ({
  updateChannelNotificationSettings,
}));

import { PUT } from "./route";

const context = { params: { channelId: "t1" } };

function withBody(body: unknown) {
  return new Request("http://localhost/api/notifications/settings", {
    method: "PUT",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("PUT /api/notifications/settings/channels/:channelId", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await PUT(withBody({ muted: true }), context);

    expect(response.status).toBe(401);
    expect(updateChannelNotificationSettings).not.toHaveBeenCalled();
  });

  it("silencia y devuelve el estado resultante", async () => {
    updateChannelNotificationSettings.mockResolvedValue({
      ok: true,
      status: 200,
      data: { channel_id: "t1", muted: true, level: null },
    });

    const response = await PUT(withBody({ muted: true }), context);

    expect(updateChannelNotificationSettings).toHaveBeenCalledWith(
      "jwt",
      "t1",
      {
        muted: true,
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      muted: true,
      level: null,
    });
  });

  it("manda el nivel y null para volver a heredar", async () => {
    updateChannelNotificationSettings.mockResolvedValue({
      ok: true,
      status: 200,
      data: { channel_id: "t1", muted: false, level: null },
    });

    await PUT(withBody({ level: "all" }), context);
    await PUT(withBody({ level: null }), context);

    expect(updateChannelNotificationSettings).toHaveBeenNthCalledWith(
      1,
      "jwt",
      "t1",
      { level: "all" },
    );
    expect(updateChannelNotificationSettings).toHaveBeenNthCalledWith(
      2,
      "jwt",
      "t1",
      { level: null },
    );
  });

  it.each([
    ["un body vacio", {}],
    ["un nivel invalido", { level: "loud" }],
    ["un muted que no es booleano", { muted: "si" }],
    ["un body que no es JSON", "no es json"],
  ])("rechaza %s con 400 sin llamar al back", async (_name, body) => {
    const response = await PUT(withBody(body), context);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      message: NOTIFICATION_SETTINGS_SAVE_FAILED,
    });
    expect(updateChannelNotificationSettings).not.toHaveBeenCalled();
  });

  it("conserva el 4xx del back", async () => {
    updateChannelNotificationSettings.mockResolvedValue({
      ok: false,
      status: 403,
      code: 403,
      message: "x",
    });

    const response = await PUT(withBody({ muted: true }), context);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      message: NOTIFICATION_SETTINGS_SAVE_FAILED,
    });
  });

  it("un fallo del servicio responde 502", async () => {
    updateChannelNotificationSettings.mockResolvedValue({
      ok: false,
      status: 503,
      code: 503,
      message: "x",
    });

    const response = await PUT(withBody({ muted: true }), context);

    expect(response.status).toBe(502);
  });

  it("traduce un 401 del back a 401", async () => {
    updateChannelNotificationSettings.mockResolvedValue({
      ok: false,
      status: 401,
      code: 401,
      message: "x",
    });

    const response = await PUT(withBody({ muted: true }), context);

    expect(response.status).toBe(401);
  });
});
