import { NOTIFICATIONS_MARK_ALL_READ_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const markTransfersRead = vi.hoisted(() => vi.fn());
vi.mock("@/services/notifications/service", () => ({ markTransfersRead }));

import { POST } from "./route";

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/notifications/history/transfers/read", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("POST /api/notifications/history/transfers/read", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await post({ transfer_ids: ["t1"] });

    expect(response.status).toBe(401);
    expect(markTransfersRead).not.toHaveBeenCalled();
  });

  it("marca las transferencias con el token del usuario", async () => {
    markTransfersRead.mockResolvedValue({ ok: true, status: 204, data: null });

    const response = await post({ transfer_ids: ["t1", "t2"] });

    expect(markTransfersRead).toHaveBeenCalledWith("jwt", ["t1", "t2"]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it.each([
    ["sin cuerpo", ""],
    ["con un cuerpo que no es JSON", "no-json"],
    ["con un cuerpo que no es un objeto", "[]"],
    ["sin la lista", {}],
    ["con la lista vacia", { transfer_ids: [] }],
    ["con una lista que no es una lista", { transfer_ids: "t1" }],
    ["con ids que no son texto", { transfer_ids: ["t1", 2] }],
  ])("responde 400 %s y no llama al back", async (_name, body) => {
    const response = await post(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      message: NOTIFICATIONS_MARK_ALL_READ_FAILED,
    });
    expect(markTransfersRead).not.toHaveBeenCalled();
  });

  it("traduce un 401 del back a 401", async () => {
    markTransfersRead.mockResolvedValue({
      ok: false,
      status: 401,
      code: 401,
      message: "x",
    });

    const response = await post({ transfer_ids: ["t1"] });

    expect(response.status).toBe(401);
  });

  it("deja pasar un 4xx del back", async () => {
    markTransfersRead.mockResolvedValue({
      ok: false,
      status: 400,
      code: 400,
      message: "x",
    });

    const response = await post({ transfer_ids: ["t1"] });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      message: NOTIFICATIONS_MARK_ALL_READ_FAILED,
    });
  });

  it("un fallo del servicio responde 502 con el mensaje del front", async () => {
    markTransfersRead.mockResolvedValue({
      ok: false,
      status: 503,
      code: 503,
      message: "x",
    });

    const response = await post({ transfer_ids: ["t1"] });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: NOTIFICATIONS_MARK_ALL_READ_FAILED,
    });
  });
});
