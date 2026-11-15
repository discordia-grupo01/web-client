import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const requestBoost = vi.hoisted(() => vi.fn());
const listBoosts = vi.hoisted(() => vi.fn());
vi.mock("@/services/billing/service", () => ({ requestBoost, listBoosts }));

import { GET, POST } from "./route";

const BOOST = {
  id: "b1",
  server_id: "club",
  points: 100,
  status: "pending",
  status_detail: "",
  created_at: "2026-11-14T12:00:00Z",
  updated_at: "2026-11-14T12:00:00Z",
};

function post(body: unknown, key?: string) {
  return new Request("http://localhost/api/billing/boosts", {
    method: "POST",
    headers: key ? { "Idempotency-Key": key } : {},
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("POST /api/billing/boosts", () => {
  it("pide el boost con la clave de idempotencia y responde 202", async () => {
    requestBoost.mockResolvedValue({ ok: true, status: 202, data: BOOST });

    const response = await POST(post({ server_id: "club" }, "k1"));

    expect(requestBoost).toHaveBeenCalledWith("jwt", "club", "k1");
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true, boost: BOOST });
  });

  it("rechaza un pedido sin servidor", async () => {
    const response = await POST(post({}));

    expect(response.status).toBe(400);
    expect(requestBoost).not.toHaveBeenCalled();
  });

  it("dice cuántos puntos faltan", async () => {
    requestBoost.mockResolvedValue({
      ok: false,
      status: 409,
      code: "INSUFFICIENT_POINTS",
      message: "x",
      details: { balance: 40, cost: 100, missing: 60 },
    });

    const response = await POST(post({ server_id: "club" }, "k1"));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      code: "INSUFFICIENT_POINTS",
      message: "Te faltan 60 puntos para boostear este servidor.",
    });
  });
});

describe("GET /api/billing/boosts", () => {
  it("devuelve mis boosts", async () => {
    listBoosts.mockResolvedValue({
      ok: true,
      status: 200,
      data: { boosts: [BOOST] },
    });

    const response = await GET();

    expect(listBoosts).toHaveBeenCalledWith("jwt");
    expect(await response.json()).toEqual({ ok: true, boosts: [BOOST] });
  });
});
