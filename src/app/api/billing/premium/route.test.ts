import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const getPremium = vi.hoisted(() => vi.fn());
vi.mock("@/services/billing/service", () => ({ getPremium }));

import { GET } from "./route";

const PREMIUM = {
  state: "active",
  active: true,
  premium_until: "2026-12-04T15:00:00Z",
  renews: true,
  mp_status: "authorized",
};

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
  getPremium.mockResolvedValue({ ok: true, status: 200, data: PREMIUM });
});

describe("GET /api/billing/premium", () => {
  it("devuelve el estado de Premium", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/billing/premium"),
    );

    expect(getPremium).toHaveBeenCalledWith("jwt", { refresh: false });
    expect(await response.json()).toEqual({ ok: true, premium: PREMIUM });
  });

  it("pasa refresh para consultar a Mercado Pago", async () => {
    await GET(
      new NextRequest("http://localhost/api/billing/premium?refresh=1"),
    );

    expect(getPremium).toHaveBeenCalledWith("jwt", { refresh: true });
  });
});
