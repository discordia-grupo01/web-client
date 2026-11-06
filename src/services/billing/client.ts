import {
  BILLING_LOAD_FAILED,
  CHECKOUT_START_FAILED,
  PAYMENT_STATUS_FAILED,
  PREMIUM_CANCEL_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";
import type {
  CheckoutResult,
  PointsOverviewResult,
  PointsPackagesResult,
  PremiumResult,
  PurchaseResult,
} from "@/types/billing.types";

async function request<T extends { ok: boolean }>(
  call: () => Promise<{ data: T }>,
  fallbackMessage: string,
): Promise<T | { ok: false; message: string }> {
  try {
    const { data } = await call();
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: fallbackMessage };
    }
    return data;
  } catch {
    return { ok: false, message: fallbackMessage };
  }
}

export function getPremiumRequest({
  refresh = false,
}: { refresh?: boolean } = {}): Promise<PremiumResult> {
  return request(
    () =>
      api.get<PremiumResult>("/billing/premium", {
        params: refresh ? { refresh: "1" } : undefined,
      }),
    BILLING_LOAD_FAILED,
  );
}

export function startPremiumCheckoutRequest(
  payerEmail: string,
): Promise<CheckoutResult> {
  return request(
    () =>
      api.post<CheckoutResult>("/billing/premium/checkout", {
        payer_email: payerEmail,
      }),
    CHECKOUT_START_FAILED,
  );
}

export function cancelPremiumRequest(): Promise<PremiumResult> {
  return request(
    () => api.post<PremiumResult>("/billing/premium/cancel"),
    PREMIUM_CANCEL_FAILED,
  );
}

export function listPointsPackagesRequest(): Promise<PointsPackagesResult> {
  return request(
    () => api.get<PointsPackagesResult>("/billing/points/packages"),
    BILLING_LOAD_FAILED,
  );
}

export function getPointsOverviewRequest(): Promise<PointsOverviewResult> {
  return request(
    () => api.get<PointsOverviewResult>("/billing/points"),
    BILLING_LOAD_FAILED,
  );
}

export function startPointsCheckoutRequest(
  packageId: string,
): Promise<CheckoutResult> {
  return request(
    () =>
      api.post<CheckoutResult>("/billing/points/checkout", {
        package_id: packageId,
      }),
    CHECKOUT_START_FAILED,
  );
}

export function getPurchaseRequest(
  purchaseId: string,
): Promise<PurchaseResult> {
  return request(
    () =>
      api.get<PurchaseResult>(
        `/billing/purchases/${encodeURIComponent(purchaseId)}`,
      ),
    PAYMENT_STATUS_FAILED,
  );
}
