import { STAFF_NOTICES_LOAD_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const listStaffNotices = vi.hoisted(() => vi.fn());
vi.mock("@/services/notifications/service", () => ({ listStaffNotices }));

import { GET } from "./route";

const notice = {
  id: "n1",
  kind: "server_deleted",
  server_id: "s1",
  server_name: "Club de Lectura",
  occurred_at: "2026-11-20T14:03:11Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("GET /api/notifications/notices", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(listStaffNotices).not.toHaveBeenCalled();
  });

  it("devuelve los avisos sin ver con el token del usuario", async () => {
    listStaffNotices.mockResolvedValue({
      ok: true,
      status: 200,
      data: { items: [notice] },
    });

    const response = await GET();

    expect(listStaffNotices).toHaveBeenCalledWith("jwt");
    expect(await response.json()).toEqual({ ok: true, notices: [notice] });
  });

  it("traduce un error del back a 502 con el texto compartido", async () => {
    listStaffNotices.mockResolvedValue({ ok: false, status: 503 });

    const response = await GET();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: STAFF_NOTICES_LOAD_FAILED,
    });
  });
});
