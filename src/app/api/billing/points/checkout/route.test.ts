import { INVALID_DATA_MESSAGE } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const startPointsCheckout = vi.hoisted(() => vi.fn());
vi.mock("@/services/billing/service", () => ({ startPointsCheckout }));

import { POST } from "./route";

function post(body: unknown): Request {
  return new Request("http://localhost/api/billing/points/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("POST /api/billing/points/checkout", () => {
  it("responde 401 sin sesión y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await POST(post({ package_id: "points_100" }));

    expect(response.status).toBe(401);
    expect(startPointsCheckout).not.toHaveBeenCalled();
  });

  it("rechaza un pedido sin paquete", async () => {
    const response = await POST(post({}));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      message: INVALID_DATA_MESSAGE,
    });
    expect(startPointsCheckout).not.toHaveBeenCalled();
  });

  it("devuelve la compra y la página de Mercado Pago", async () => {
    const checkout = {
      purchase_id: "p1",
      checkout_url: "https://mercadopago.example/checkout",
    };
    startPointsCheckout.mockResolvedValue({
      ok: true,
      status: 201,
      data: checkout,
    });

    const response = await POST(post({ package_id: "points_550" }));

    expect(startPointsCheckout).toHaveBeenCalledWith("jwt", {
      package_id: "points_550",
    });
    expect(await response.json()).toEqual({ ok: true, checkout });
  });

  it("traduce un paquete desconocido", async () => {
    startPointsCheckout.mockResolvedValue({
      ok: false,
      status: 400,
      code: "UNKNOWN_PACKAGE",
      message: "x",
    });

    const response = await POST(post({ package_id: "points_7" }));

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("UNKNOWN_PACKAGE");
  });
});
