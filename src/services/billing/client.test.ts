import { CHECKOUT_START_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/browserApiClient", () => ({ api: { post } }));

import { startPremiumCheckoutRequest } from "./client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("startPremiumCheckoutRequest", () => {
  it("manda la Idempotency-Key y devuelve el checkout", async () => {
    const checkout = { checkout_url: "https://mp/premium" };
    post.mockResolvedValue({ data: { ok: true, checkout } });

    const result = await startPremiumCheckoutRequest("ana@example.com", "k1");

    expect(post).toHaveBeenCalledWith(
      "/billing/premium/checkout",
      { payer_email: "ana@example.com" },
      { headers: { "Idempotency-Key": "k1" } },
    );
    expect(result).toEqual({ ok: true, data: checkout });
  });

  it("conserva el código y el mensaje del BFF", async () => {
    post.mockResolvedValue({
      data: { ok: false, code: "CHECKOUT_IN_PROGRESS", message: "esperá" },
    });

    expect(await startPremiumCheckoutRequest("a@b.com", "k1")).toEqual({
      ok: false,
      code: "CHECKOUT_IN_PROGRESS",
      message: "esperá",
    });
  });

  it("sin respuesta usa el mensaje de la operación", async () => {
    post.mockRejectedValue(new Error("offline"));

    expect(await startPremiumCheckoutRequest("a@b.com", "k1")).toEqual({
      ok: false,
      code: "NETWORK_ERROR",
      message: CHECKOUT_START_FAILED,
    });
  });
});
