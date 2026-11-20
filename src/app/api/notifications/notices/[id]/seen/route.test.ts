import { STAFF_NOTICE_SEEN_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const markStaffNoticeSeen = vi.hoisted(() => vi.fn());
vi.mock("@/services/notifications/service", () => ({ markStaffNoticeSeen }));

import { POST } from "./route";

const post = (id: string) =>
  POST(
    new Request(`http://localhost/api/notifications/notices/${id}/seen`, {
      method: "POST",
    }),
    { params: { id } },
  );

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("POST /api/notifications/notices/:id/seen", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await post("n1");

    expect(response.status).toBe(401);
    expect(markStaffNoticeSeen).not.toHaveBeenCalled();
  });

  it("marca el aviso con el token del usuario", async () => {
    markStaffNoticeSeen.mockResolvedValue({
      ok: true,
      status: 204,
      data: null,
    });

    const response = await post("n1");

    expect(markStaffNoticeSeen).toHaveBeenCalledWith("jwt", "n1");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("pasa un 400 del back con el texto compartido", async () => {
    markStaffNoticeSeen.mockResolvedValue({ ok: false, status: 400 });

    const response = await post("no-es-uuid");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      message: STAFF_NOTICE_SEEN_FAILED,
    });
  });
});
