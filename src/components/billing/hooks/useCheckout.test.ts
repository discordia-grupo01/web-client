import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const startPremiumCheckoutRequest = vi.fn();
const startPointsCheckoutRequest = vi.fn();

vi.mock("@/services/billing/client", () => ({
  startPremiumCheckoutRequest: (...args: unknown[]) =>
    startPremiumCheckoutRequest(...args),
  startPointsCheckoutRequest: (...args: unknown[]) =>
    startPointsCheckoutRequest(...args),
}));

import { useCheckout } from "./useCheckout";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCheckout", () => {
  it("manda a la página de Mercado Pago y queda pendiente", async () => {
    const navigate = vi.fn();
    startPointsCheckoutRequest.mockResolvedValue({
      ok: true,
      checkout: { purchase_id: "p1", checkout_url: "https://mp/checkout" },
    });
    const { result } = renderHook(() => useCheckout({ navigate }));

    await act(() => result.current.startPoints("points_550"));

    expect(startPointsCheckoutRequest).toHaveBeenCalledWith("points_550");
    expect(navigate).toHaveBeenCalledWith("https://mp/checkout");
    expect(result.current.pending).toBe(true);
  });

  it("si el back rechaza muestra el error y no navega", async () => {
    const navigate = vi.fn();
    startPremiumCheckoutRequest.mockResolvedValue({
      ok: false,
      message: "Ya tenés una suscripción a Premium activa.",
      code: "ALREADY_SUBSCRIBED",
    });
    const { result } = renderHook(() => useCheckout({ navigate }));

    await act(() => result.current.startPremium("ana@example.com"));

    expect(startPremiumCheckoutRequest).toHaveBeenCalledWith("ana@example.com");
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBe(
      "Ya tenés una suscripción a Premium activa.",
    );
  });
});
