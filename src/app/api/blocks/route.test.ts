import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const listBlocks = vi.hoisted(() => vi.fn());
const blockUser = vi.hoisted(() => vi.fn());
const unblockUser = vi.hoisted(() => vi.fn());
vi.mock("@/services/blocks/service", () => ({
  listBlocks,
  blockUser,
  unblockUser,
}));

import { GET, POST } from "./route";
import { DELETE } from "./[userId]/route";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/blocks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt" });
});

describe("GET /api/blocks", () => {
  it("responde 401 sin sesion", async () => {
    getValidSession.mockResolvedValue(null);

    expect((await GET()).status).toBe(401);
    expect(listBlocks).not.toHaveBeenCalled();
  });

  it("devuelve solo los ids de los bloqueados", async () => {
    listBlocks.mockResolvedValue({
      ok: true,
      status: 200,
      data: { blocks: [{ user_id: "u2", created_at: "2026-10-01T00:00:00Z" }] },
    });

    const response = await GET();

    expect(await response.json()).toEqual({
      ok: true,
      blockedUserIds: ["u2"],
    });
  });
});

describe("POST /api/blocks", () => {
  it("bloquea y responde ok", async () => {
    blockUser.mockResolvedValue({ ok: true, status: 204, data: null });

    const response = await post({ userId: "u2" });

    expect(blockUser).toHaveBeenCalledWith("jwt", "u2");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("traduce el codigo del back y conserva el status", async () => {
    blockUser.mockResolvedValue({
      ok: false,
      status: 404,
      code: "USER_NOT_FOUND",
      message: "x",
    });

    const response = await post({ userId: "u2" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      ok: false,
      message: "Este usuario no existe.",
    });
  });

  it("un error del servidor sale como 502 con el texto generico", async () => {
    blockUser.mockResolvedValue({
      ok: false,
      status: 500,
      code: "BOOM",
      message: "x",
    });

    const response = await post({ userId: "u2" });

    expect(response.status).toBe(502);
  });

  it("responde 401 si el back rechaza la sesion", async () => {
    blockUser.mockResolvedValue({
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "x",
    });

    expect((await post({ userId: "u2" })).status).toBe(401);
  });
});

describe("DELETE /api/blocks/:userId", () => {
  it("desbloquea y responde ok", async () => {
    unblockUser.mockResolvedValue({ ok: true, status: 204, data: null });

    const response = await DELETE(
      new Request("http://localhost/api/blocks/u2"),
      {
        params: { userId: "u2" },
      },
    );

    expect(unblockUser).toHaveBeenCalledWith("jwt", "u2");
    expect(await response.json()).toEqual({ ok: true });
  });
});
