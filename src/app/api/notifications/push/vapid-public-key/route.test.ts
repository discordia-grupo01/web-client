import {
  PUSH_NOT_AVAILABLE,
  PUSH_REGISTER_FAILED,
} from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const getVapidPublicKey = vi.hoisted(() => vi.fn());
vi.mock("@/services/push/service", () => ({ getVapidPublicKey }));

import { GET } from "./route";

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

describe("GET /api/notifications/push/vapid-public-key", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(getVapidPublicKey).not.toHaveBeenCalled();
  });

  it("devuelve la clave publica con el nombre que usa el front", async () => {
    getVapidPublicKey.mockResolvedValue({
      ok: true,
      status: 200,
      data: { public_key: "BKey" },
    });

    const response = await GET();

    expect(getVapidPublicKey).toHaveBeenCalledWith("jwt");
    expect(await response.json()).toEqual({ ok: true, publicKey: "BKey" });
  });

  it("si el push web no esta configurado responde 404 con su mensaje", async () => {
    getVapidPublicKey.mockResolvedValue(failure(404));

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      ok: false,
      message: PUSH_NOT_AVAILABLE,
    });
  });

  it("un fallo del servicio responde 502", async () => {
    getVapidPublicKey.mockResolvedValue(failure(503));

    const response = await GET();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: PUSH_REGISTER_FAILED,
    });
  });

  it("traduce un 401 del back a 401", async () => {
    getVapidPublicKey.mockResolvedValue(failure(401));

    expect((await GET()).status).toBe(401);
  });
});
