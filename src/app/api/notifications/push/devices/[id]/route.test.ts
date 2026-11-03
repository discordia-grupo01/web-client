import { PUSH_UNREGISTER_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const unregisterPushDevice = vi.hoisted(() => vi.fn());
vi.mock("@/services/push/service", () => ({ unregisterPushDevice }));

import { DELETE } from "./route";

const context = { params: { id: "d1" } };
const request = () =>
  new Request("http://localhost/api/notifications/push/devices/d1", {
    method: "DELETE",
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

describe("DELETE /api/notifications/push/devices/:id", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await DELETE(request(), context);

    expect(response.status).toBe(401);
    expect(unregisterPushDevice).not.toHaveBeenCalled();
  });

  it("borra el dispositivo", async () => {
    unregisterPushDevice.mockResolvedValue({
      ok: true,
      status: 204,
      data: null,
    });

    const response = await DELETE(request(), context);

    expect(unregisterPushDevice).toHaveBeenCalledWith("jwt", "d1");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("un fallo del servicio responde 502 con el mensaje del front", async () => {
    unregisterPushDevice.mockResolvedValue(failure(503));

    const response = await DELETE(request(), context);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: PUSH_UNREGISTER_FAILED,
    });
  });

  it("conserva el 4xx del back", async () => {
    unregisterPushDevice.mockResolvedValue(failure(404));

    expect((await DELETE(request(), context)).status).toBe(404);
  });

  it("traduce un 401 del back a 401", async () => {
    unregisterPushDevice.mockResolvedValue(failure(401));

    expect((await DELETE(request(), context)).status).toBe(401);
  });
});
