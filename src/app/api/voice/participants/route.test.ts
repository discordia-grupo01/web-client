import { VOICE_PARTICIPANTS_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const listVoiceParticipants = vi.hoisted(() => vi.fn());
vi.mock("@/services/voice/service", () => ({ listVoiceParticipants }));

import { GET } from "./route";

function get(serverId: string) {
  return GET(
    new Request(`http://localhost/api/voice/participants?serverId=${serverId}`),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt" });
});

describe("GET /api/voice/participants", () => {
  it("responde 401 sin sesion", async () => {
    getValidSession.mockResolvedValue(null);

    expect((await get("s1")).status).toBe(401);
  });

  it("agrupa a los participantes por canal", async () => {
    listVoiceParticipants.mockResolvedValue({
      ok: true,
      data: {
        server_id: "s1",
        channels: [
          {
            channel_id: "c1",
            participants: [
              { participant_id: "u2", name: "Zoe" },
              { participant_id: "u1", name: "Ana" },
            ],
          },
        ],
      },
    });

    const response = await get("s1");

    expect(listVoiceParticipants).toHaveBeenCalledWith("jwt", "s1");
    expect(await response.json()).toEqual({
      ok: true,
      byChannel: {
        c1: [
          { participant_id: "u1", name: "Ana" },
          { participant_id: "u2", name: "Zoe" },
        ],
      },
    });
  });

  it("si falla devuelve el mensaje de participantes", async () => {
    listVoiceParticipants.mockResolvedValue({
      ok: false,
      status: 500,
      code: undefined,
    });

    const response = await get("s1");

    expect(response.status).toBe(502);
    expect((await response.json()).message).toBe(VOICE_PARTICIPANTS_FAILED);
  });
});
