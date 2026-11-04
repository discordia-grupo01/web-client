import { PRIVATE_CALL_INVALID_STATE } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const privateCallAction = vi.hoisted(() => vi.fn());
vi.mock("@/services/voice/service", () => ({ privateCallAction }));

import { POST } from "./route";

const accepted = {
  call_id: "call-1",
  conversation_id: "conv-1",
  caller_id: "ana",
  recipient_id: "beto",
  room_name: "private-call:call-1",
  status: "active",
  token: "jwt-livekit",
  url: "wss://livekit",
};

function act(action: string) {
  return POST(
    new Request(`http://localhost/api/voice/calls/call-1/${action}`, {
      method: "POST",
    }),
    { params: { id: "call-1", action } },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt" });
});

describe("POST /api/voice/calls/:id/:action", () => {
  it("no conoce otras acciones", async () => {
    expect((await act("hold")).status).toBe(404);
    expect(privateCallAction).not.toHaveBeenCalled();
  });

  it("responde 401 sin sesion", async () => {
    getValidSession.mockResolvedValue(null);

    expect((await act("accept")).status).toBe(401);
  });

  it("al aceptar devuelve las credenciales de LiveKit", async () => {
    privateCallAction.mockResolvedValue({ ok: true, data: accepted });

    const response = await act("accept");

    expect(privateCallAction).toHaveBeenCalledWith("jwt", "call-1", "accept");
    expect(await response.json()).toEqual({ ok: true, call: accepted });
  });

  it.each(["reject", "finish"])("%s responde ok sin cuerpo", async (action) => {
    privateCallAction.mockResolvedValue({ ok: true, data: "" });

    expect(await (await act(action)).json()).toEqual({ ok: true });
    expect(privateCallAction).toHaveBeenCalledWith("jwt", "call-1", action);
  });

  it("si la llamada ya se atendio, lo dice", async () => {
    privateCallAction.mockResolvedValue({
      ok: false,
      status: 409,
      code: "invalid_call_state",
    });

    const response = await act("accept");

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      message: PRIVATE_CALL_INVALID_STATE,
    });
  });
});
