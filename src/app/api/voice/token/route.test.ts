import {
  VOICE_CONNECT_FAILED,
  VOICE_CONNECT_FORBIDDEN,
} from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const requestVoiceToken = vi.hoisted(() => vi.fn());
vi.mock("@/services/voice/service", () => ({ requestVoiceToken }));

import { POST } from "./route";

const token = {
  identity: "u1",
  name: "Juana",
  room_name: "voice:c1",
  token: "lk-token",
  url: "ws://localhost:7880",
};

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/voice/token", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt" });
});

describe("POST /api/voice/token", () => {
  it("responde 401 sin sesion", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await post({ channelId: "c1" });

    expect(response.status).toBe(401);
    expect(requestVoiceToken).not.toHaveBeenCalled();
  });

  it("pide el token del canal y lo devuelve", async () => {
    requestVoiceToken.mockResolvedValue({ ok: true, data: token });

    const response = await post({ channelId: "c1" });

    expect(requestVoiceToken).toHaveBeenCalledWith("jwt", "c1");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, token });
  });

  it("traduce voice_forbidden al mensaje de permiso", async () => {
    requestVoiceToken.mockResolvedValue({
      ok: false,
      status: 403,
      code: "voice_forbidden",
    });

    const response = await post({ channelId: "c1" });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      message: VOICE_CONNECT_FORBIDDEN,
    });
  });

  it("sin respuesta del back usa el mensaje generico y 502", async () => {
    requestVoiceToken.mockResolvedValue({
      ok: false,
      status: 0,
      code: undefined,
    });

    const response = await post({ channelId: "c1" });

    expect(response.status).toBe(502);
    expect((await response.json()).message).toBe(VOICE_CONNECT_FAILED);
  });
});
