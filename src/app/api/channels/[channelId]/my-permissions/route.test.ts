import { MEMBER_PERMISSIONS_LOAD_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const getMemberChannelPermissions = vi.hoisted(() => vi.fn());
vi.mock("@/services/channel-permissions/service", () => ({
  getMemberChannelPermissions,
}));

import { GET } from "./route";

const context = { params: { channelId: "ch1" } };

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("GET /api/channels/:channelId/my-permissions", () => {
  it("responde 401 sin sesion", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(401);
    expect(getMemberChannelPermissions).not.toHaveBeenCalled();
  });

  it("pide los permisos del usuario de la sesion en ese canal", async () => {
    getMemberChannelPermissions.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        channel_id: "ch1",
        user_id: "u1",
        permissions: ["VIEW_CHANNELS", "ADD_REACTIONS"],
      },
    });

    const response = await GET(new Request("http://localhost"), context);

    expect(getMemberChannelPermissions).toHaveBeenCalledWith(
      "jwt",
      "ch1",
      "u1",
    );
    expect(await response.json()).toEqual({
      ok: true,
      permissions: ["VIEW_CHANNELS", "ADD_REACTIONS"],
    });
  });

  it("si falla devuelve un mensaje generico y conserva el 4xx", async () => {
    getMemberChannelPermissions.mockResolvedValue({
      ok: false,
      status: 404,
      code: 404,
      message: "x",
    });

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      ok: false,
      message: MEMBER_PERMISSIONS_LOAD_FAILED,
    });
  });
});
