import {
  BILLING_LOAD_FAILED,
  type BillingResult,
  CHECKOUT_START_FAILED,
  type CheckoutResponse,
  PAYMENT_STATUS_FAILED,
  type PointPurchase,
  type PointsOverview,
  type PointsPackagesResponse,
  PREMIUM_CANCEL_FAILED,
  type PremiumView,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";
import type {
  BillingFailure,
  CheckoutResult,
  PointsOverviewResult,
  PointsPackagesResult,
  PremiumResult,
  PurchaseResult,
} from "@/types/billing.types";

async function request<S extends { ok: true }, T>(
  call: () => Promise<{ data: S | BillingFailure }>,
  read: (body: S) => T,
  fallbackMessage: string,
): Promise<BillingResult<T>> {
  try {
    const { data } = await call();
    if (data?.ok === true) return { ok: true, data: read(data) };
    if (data?.ok === false) {
      return {
        ok: false,
        code: data.code ?? "UNKNOWN_ERROR",
        message: data.message,
      };
    }
  } catch {
    return { ok: false, code: "NETWORK_ERROR", message: fallbackMessage };
  }
  return { ok: false, code: "UNKNOWN_ERROR", message: fallbackMessage };
}

function idempotencyHeaders(key: string) {
  return { headers: { "Idempotency-Key": key } };
}

export function getPremiumRequest({
  refresh = false,
}: { refresh?: boolean } = {}): Promise<BillingResult<PremiumView>> {
  return request(
    () =>
      api.get<PremiumResult>("/billing/premium", {
        params: refresh ? { refresh: "1" } : undefined,
      }),
    (body) => body.premium,
    BILLING_LOAD_FAILED,
  );
}

export function startPremiumCheckoutRequest(
  payerEmail: string,
  idempotencyKey: string,
): Promise<BillingResult<CheckoutResponse>> {
  return request(
    () =>
      api.post<CheckoutResult>(
        "/billing/premium/checkout",
        { payer_email: payerEmail },
        idempotencyHeaders(idempotencyKey),
      ),
    (body) => body.checkout,
    CHECKOUT_START_FAILED,
  );
}

export function cancelPremiumRequest(): Promise<BillingResult<PremiumView>> {
  return request(
    () => api.post<PremiumResult>("/billing/premium/cancel"),
    (body) => body.premium,
    PREMIUM_CANCEL_FAILED,
  );
}

export function listPointsPackagesRequest(): Promise<
  BillingResult<PointsPackagesResponse>
> {
  return request(
    () => api.get<PointsPackagesResult>("/billing/points/packages"),
    (body) => ({ packages: body.packages }),
    BILLING_LOAD_FAILED,
  );
}

export function getPointsOverviewRequest(): Promise<
  BillingResult<PointsOverview>
> {
  return request(
    () => api.get<PointsOverviewResult>("/billing/points"),
    (body) => body.points,
    BILLING_LOAD_FAILED,
  );
}

export function startPointsCheckoutRequest(
  packageId: string,
  idempotencyKey: string,
): Promise<BillingResult<CheckoutResponse>> {
  return request(
    () =>
      api.post<CheckoutResult>(
        "/billing/points/checkout",
        { package_id: packageId },
        idempotencyHeaders(idempotencyKey),
      ),
    (body) => body.checkout,
    CHECKOUT_START_FAILED,
  );
}

export function getPurchaseRequest(
  purchaseId: string,
): Promise<BillingResult<PointPurchase>> {
  return request(
    () =>
      api.get<PurchaseResult>(
        `/billing/purchases/${encodeURIComponent(purchaseId)}`,
      ),
    (body) => body.purchase,
    PAYMENT_STATUS_FAILED,
  );
}
