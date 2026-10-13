import { VOICE_LEAVE_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const leaveVoiceSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/voice/service", () => ({ leaveVoiceSession }));

import { DELETE } from "./route";

function remove(body: unknown) {
  return DELETE(
    new Request("http://localhost/api/voice/session", {
      method: "DELETE",
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt" });
});

describe("DELETE /api/voice/session", () => {
  it("responde 401 sin sesion", async () => {
    getValidSession.mockResolvedValue(null);

    expect((await remove({ channelId: "c1" })).status).toBe(401);
    expect(leaveVoiceSession).not.toHaveBeenCalled();
  });

  it("avisa a signaling que saliste del canal", async () => {
    leaveVoiceSession.mockResolvedValue({ ok: true, data: "" });

    const response = await remove({ channelId: "c1" });

    expect(leaveVoiceSession).toHaveBeenCalledWith("jwt", "c1");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("si signaling no esta, avisa que no se pudo avisar", async () => {
    leaveVoiceSession.mockResolvedValue({
      ok: false,
      status: 0,
      code: undefined,
    });

    const response = await remove({ channelId: "c1" });

    expect(response.status).toBe(502);
    expect((await response.json()).message).toBe(VOICE_LEAVE_FAILED);
  });
});
