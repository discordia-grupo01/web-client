import {
  PAYMENT_RETURN_POLL_MS,
  PAYMENT_RETURN_TIMEOUT_MS,
  PAYMENT_STATUS_FAILED,
  type PointPurchase,
} from "@discordia/client-shared";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getPurchaseRequest = vi.fn();
const getPremiumRequest = vi.fn();
const getPointsOverviewRequest = vi.fn();

vi.mock("@/services/billing/client", () => ({
  getPurchaseRequest: (...args: unknown[]) => getPurchaseRequest(...args),
  getPremiumRequest: (...args: unknown[]) => getPremiumRequest(...args),
  getPointsOverviewRequest: (...args: unknown[]) =>
    getPointsOverviewRequest(...args),
}));

import { usePaymentReturn } from "./usePaymentReturn";

function purchase(status: PointPurchase["status"]): PointPurchase {
  return {
    id: "p1",
    package_id: "points_550",
    points: 550,
    price_cents: 500_000,
    status,
    status_detail: status === "failed" ? "insufficient_amount" : "",
    points_unrecovered: 0,
    created_at: "2026-11-04T20:00:00Z",
    updated_at: "2026-11-04T20:00:00Z",
  };
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  getPointsOverviewRequest.mockResolvedValue({
    ok: true,
    data: { balance: 1_200, ledger: [], purchases: [] },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePaymentReturn", () => {
  it("sin parámetros válidos muestra compra no encontrada sin consultar", () => {
    const { result } = renderHook(() => usePaymentReturn(null));

    expect(result.current.progress).toEqual({
      outcome: "points_not_found",
      done: true,
    });
    expect(getPurchaseRequest).not.toHaveBeenCalled();
  });

  it("consulta la compra hasta que se acredita y trae el saldo nuevo", async () => {
    getPurchaseRequest
      .mockResolvedValueOnce({ ok: true, data: purchase("pending") })
      .mockResolvedValueOnce({ ok: true, data: purchase("paid") });

    const { result } = renderHook(() =>
      usePaymentReturn({ kind: "points", purchaseId: "p1" }),
    );
    await flush();
    expect(result.current.progress.outcome).toBe("verifying");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PAYMENT_RETURN_POLL_MS);
    });

    expect(getPurchaseRequest).toHaveBeenCalledTimes(2);
    expect(result.current.progress).toEqual({
      outcome: "points_accredited",
      done: true,
    });
    expect(result.current.balance).toBe(1_200);
  });

  it("un 404 es compra no encontrada", async () => {
    getPurchaseRequest.mockResolvedValue({
      ok: false,
      code: "PURCHASE_NOT_FOUND",
      message: "x",
    });

    const { result } = renderHook(() =>
      usePaymentReturn({ kind: "points", purchaseId: "otra" }),
    );
    await flush();

    expect(result.current.progress.outcome).toBe("points_not_found");
  });

  it("si sigue pendiente al timeout queda como pendiente", async () => {
    getPurchaseRequest.mockResolvedValue({
      ok: true,
      data: purchase("pending"),
    });

    const { result } = renderHook(() =>
      usePaymentReturn({ kind: "points", purchaseId: "p1" }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PAYMENT_RETURN_TIMEOUT_MS);
    });

    expect(result.current.progress).toEqual({
      outcome: "points_pending",
      done: true,
    });
  });

  it("si nunca puede consultar avisa el error y permite reintentar", async () => {
    getPremiumRequest.mockResolvedValue({
      ok: false,
      code: "NETWORK_ERROR",
      message: "sin red",
    });

    const { result } = renderHook(() =>
      usePaymentReturn({ kind: "premium", purchaseId: null }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PAYMENT_RETURN_TIMEOUT_MS);
    });
    expect(result.current.error).toBe(PAYMENT_STATUS_FAILED);

    getPremiumRequest.mockResolvedValue({
      ok: true,
      data: {
        state: "active",
        active: true,
        premium_until: "2026-12-04T15:00:00Z",
        renews: true,
        mp_status: "authorized",
      },
    });
    act(() => result.current.retry());
    await flush();

    expect(getPremiumRequest).toHaveBeenLastCalledWith({ refresh: true });
    expect(result.current.error).toBeNull();
    expect(result.current.progress.outcome).toBe("premium_active");
  });
});
