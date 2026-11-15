import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const listBoostedServers = vi.hoisted(() => vi.fn());
vi.mock("@/services/billing/service", () => ({ listBoostedServers }));

import { GET } from "./route";

const PAGE = {
  servers: [
    {
      server_id: "club",
      active: 7,
      pending: 0,
      failed: 1,
      removed: 2,
      last_boost_at: "2026-11-14T12:00:00Z",
    },
  ],
  total: 14,
  limit: 10,
  offset: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("GET /api/billing/boosts/servers", () => {
  it("reenvía la página pedida y devuelve los servidores", async () => {
    listBoostedServers.mockResolvedValue({ ok: true, status: 200, data: PAGE });

    const response = await GET(
      new Request(
        "http://localhost/api/billing/boosts/servers?limit=10&offset=10&otro=x",
      ),
    );

    expect(listBoostedServers).toHaveBeenCalledWith("jwt", {
      limit: "10",
      offset: "10",
    });
    expect(await response.json()).toEqual({ ok: true, page: PAGE });
  });

  it("sin sesión responde 401", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/billing/boosts/servers"),
    );

    expect(response.status).toBe(401);
    expect(listBoostedServers).not.toHaveBeenCalled();
  });
});
