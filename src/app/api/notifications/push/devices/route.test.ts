import {
  PUSH_DEVICE_LIMIT_REACHED,
  PUSH_REGISTER_FAILED,
} from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const registerPushDevice = vi.hoisted(() => vi.fn());
vi.mock("@/services/push/service", () => ({ registerPushDevice }));

import { POST } from "./route";

const WEB_DEVICE = {
  provider: "webpush",
  platform: "web",
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  p256dh: "p",
  auth: "a",
};

const withBody = (body: unknown) =>
  new Request("http://localhost/api/notifications/push/devices", {
    method: "POST",
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

describe("POST /api/notifications/push/devices", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await POST(withBody(WEB_DEVICE));

    expect(response.status).toBe(401);
    expect(registerPushDevice).not.toHaveBeenCalled();
  });

  it("registra el dispositivo y devuelve su id", async () => {
    registerPushDevice.mockResolvedValue({
      ok: true,
      status: 201,
      data: { id: "d1" },
    });

    const response = await POST(withBody(WEB_DEVICE));

    expect(registerPushDevice).toHaveBeenCalledWith("jwt", WEB_DEVICE);
    expect(await response.json()).toEqual({ ok: true, id: "d1" });
  });

  it("acepta un dispositivo de Expo", async () => {
    registerPushDevice.mockResolvedValue({
      ok: true,
      status: 200,
      data: { id: "d2" },
    });
    const device = {
      provider: "expo",
      platform: "android",
      token: "ExponentPushToken[abc]",
    };

    await POST(withBody(device));

    expect(registerPushDevice).toHaveBeenCalledWith("jwt", device);
  });

  it("no reenvia campos que no conoce", async () => {
    registerPushDevice.mockResolvedValue({
      ok: true,
      status: 201,
      data: { id: "d1" },
    });

    await POST(withBody({ ...WEB_DEVICE, extra: "x" }));

    expect(registerPushDevice).toHaveBeenCalledWith("jwt", WEB_DEVICE);
  });

  it.each([
    ["un body vacio", {}],
    [
      "un endpoint que no es https",
      { ...WEB_DEVICE, endpoint: "http://x.example.com" },
    ],
    ["un proveedor desconocido", { provider: "apns", platform: "ios" }],
    ["un body que no es JSON", "no es json"],
  ])("rechaza %s con 400 sin llamar al back", async (_name, body) => {
    const response = await POST(withBody(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      message: PUSH_REGISTER_FAILED,
    });
    expect(registerPushDevice).not.toHaveBeenCalled();
  });

  it("avisa cuando se alcanzo el maximo de dispositivos", async () => {
    registerPushDevice.mockResolvedValue(failure(409));

    const response = await POST(withBody(WEB_DEVICE));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      message: PUSH_DEVICE_LIMIT_REACHED,
      limitReached: true,
    });
  });

  it("conserva el 4xx del back y responde 502 ante un 5xx", async () => {
    registerPushDevice.mockResolvedValueOnce(failure(400));
    expect((await POST(withBody(WEB_DEVICE))).status).toBe(400);

    registerPushDevice.mockResolvedValueOnce(failure(503));
    expect((await POST(withBody(WEB_DEVICE))).status).toBe(502);
  });

  it("traduce un 401 del back a 401", async () => {
    registerPushDevice.mockResolvedValue(failure(401));

    expect((await POST(withBody(WEB_DEVICE))).status).toBe(401);
  });
});
