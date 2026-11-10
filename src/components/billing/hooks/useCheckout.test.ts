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

const POINTS = {
  kind: "points",
  packageId: "points_550",
  points: 550,
  priceCents: 500_000,
} as const;
const PREMIUM = { kind: "premium", priceCents: 499_900 } as const;
const UUID = expect.stringMatching(/^[0-9a-f-]{36}$/);

function keyOfCall(mock: typeof startPremiumCheckoutRequest, call: number) {
  return mock.mock.calls[call][1];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCheckout", () => {
  it("manda a la página de Mercado Pago y queda pendiente", async () => {
    const navigate = vi.fn();
    startPointsCheckoutRequest.mockResolvedValue({
      ok: true,
      data: { purchase_id: "p1", checkout_url: "https://mp/checkout" },
    });
    const { result } = renderHook(() => useCheckout({ navigate }));

    await act(() => result.current.start(POINTS, ""));

    expect(startPointsCheckoutRequest).toHaveBeenCalledWith("points_550", UUID);
    expect(navigate).toHaveBeenCalledWith("https://mp/checkout");
    expect(result.current.pending).toBe(true);
  });

  it("si el back rechaza muestra el error y no navega", async () => {
    const navigate = vi.fn();
    startPremiumCheckoutRequest.mockResolvedValue({
      ok: false,
      code: "ALREADY_SUBSCRIBED",
      message: "Ya tenés una suscripción a Premium activa.",
    });
    const { result } = renderHook(() => useCheckout({ navigate }));

    await act(() => result.current.start(PREMIUM, "ana@example.com"));

    expect(startPremiumCheckoutRequest).toHaveBeenCalledWith(
      "ana@example.com",
      UUID,
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBe(
      "Ya tenés una suscripción a Premium activa.",
    );
  });

  it("un doble clic pide un solo checkout", async () => {
    startPremiumCheckoutRequest.mockResolvedValue({
      ok: true,
      data: { checkout_url: "https://mp/premium" },
    });
    const { result } = renderHook(() => useCheckout({ navigate: vi.fn() }));

    await act(() =>
      Promise.all([
        result.current.start(PREMIUM, "ana@example.com"),
        result.current.start(PREMIUM, "ana@example.com"),
      ]),
    );

    expect(startPremiumCheckoutRequest).toHaveBeenCalledTimes(1);
  });

  it("reintentar después de un error usa la misma clave", async () => {
    startPremiumCheckoutRequest.mockResolvedValue({
      ok: false,
      code: "NETWORK_ERROR",
      message: "sin red",
    });
    const { result } = renderHook(() => useCheckout({ navigate: vi.fn() }));

    await act(() => result.current.start(PREMIUM, "ana@example.com"));
    await act(() => result.current.start(PREMIUM, "ana@example.com"));

    expect(keyOfCall(startPremiumCheckoutRequest, 1)).toBe(
      keyOfCall(startPremiumCheckoutRequest, 0),
    );
  });

  it("si el back rechaza la clave por reusada, la cambia", async () => {
    startPremiumCheckoutRequest.mockResolvedValue({
      ok: false,
      code: "IDEMPOTENCY_KEY_REUSED",
      message: "x",
    });
    const { result } = renderHook(() => useCheckout({ navigate: vi.fn() }));

    await act(() => result.current.start(PREMIUM, "ana@example.com"));
    await act(() => result.current.start(PREMIUM, "otra@example.com"));

    expect(keyOfCall(startPremiumCheckoutRequest, 1)).not.toBe(
      keyOfCall(startPremiumCheckoutRequest, 0),
    );
  });

  it("cerrar el checkout descarta la clave", async () => {
    startPointsCheckoutRequest.mockResolvedValue({
      ok: false,
      code: "UNKNOWN_PACKAGE",
      message: "x",
    });
    const { result } = renderHook(() => useCheckout({ navigate: vi.fn() }));

    await act(() => result.current.start(POINTS, ""));
    act(() => result.current.reset());
    await act(() => result.current.start(POINTS, ""));

    expect(keyOfCall(startPointsCheckoutRequest, 1)).not.toBe(
      keyOfCall(startPointsCheckoutRequest, 0),
    );
    expect(result.current.error).toBe("x");
  });
});
