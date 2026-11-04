import {
  PRIVATE_CALL_FORBIDDEN,
  PRIVATE_CALL_START_FAILED,
} from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const startPrivateCall = vi.hoisted(() => vi.fn());
vi.mock("@/services/voice/service", () => ({ startPrivateCall }));

import { POST } from "./route";

const call = {
  call_id: "call-1",
  conversation_id: "conv-1",
  caller_id: "ana",
  recipient_id: "beto",
  room_name: "private-call:call-1",
  status: "ringing",
};

function start(body: unknown) {
  return POST(
    new Request("http://localhost/api/voice/calls", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt" });
});

describe("POST /api/voice/calls", () => {
  it("responde 401 sin sesion", async () => {
    getValidSession.mockResolvedValue(null);

    expect((await start({})).status).toBe(401);
    expect(startPrivateCall).not.toHaveBeenCalled();
  });

  it("inicia la llamada y devuelve la llamada sonando", async () => {
    startPrivateCall.mockResolvedValue({ ok: true, data: call });

    const response = await start({
      recipientId: "beto",
      conversationId: "conv-1",
    });

    expect(startPrivateCall).toHaveBeenCalledWith("jwt", "beto", "conv-1");
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, call });
  });

  it("traduce el codigo de signaling al texto para la persona", async () => {
    startPrivateCall.mockResolvedValue({
      ok: false,
      status: 403,
      code: "voice_call_forbidden",
    });

    const response = await start({
      recipientId: "beto",
      conversationId: "conv-1",
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      message: PRIVATE_CALL_FORBIDDEN,
    });
  });

  it("si signaling responde algo invalido, avisa que no se pudo llamar", async () => {
    startPrivateCall.mockResolvedValue({ ok: true, data: { foo: 1 } });

    const response = await start({
      recipientId: "beto",
      conversationId: "conv-1",
    });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: PRIVATE_CALL_START_FAILED,
    });
  });
});
