import type {
  CheckoutResponse,
  PointPurchase,
  PointsCheckoutRequest,
  PointsOverview,
  PointsPackagesResponse,
  PremiumCheckoutRequest,
  PremiumView,
} from "@discordia/client-shared";
import { BILLING_HISTORY_MAX_LIMIT } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra billing (Premium y puntos con Mercado Pago). Todas
 * las rutas van por el Gateway con el JWT del usuario.
 *
 *   GET  /v1/billing/premium[?refresh=1] -> 200 PremiumView
 *   POST /v1/billing/premium/checkout    -> 201 {checkout_url} | 400 | 409 ALREADY_SUBSCRIBED
 *   POST /v1/billing/premium/cancel      -> 200 PremiumView | 409 NO_LIVE_SUBSCRIPTION
 *   GET  /v1/billing/points/packages     -> 200 {packages}
 *   GET  /v1/billing/points              -> 200 {balance, ledger, purchases}
 *   POST /v1/billing/points/checkout     -> 201 {purchase_id, checkout_url} | 400 UNKNOWN_PACKAGE
 *   GET  /v1/billing/purchases/:id       -> 200 PointPurchase | 404 PURCHASE_NOT_FOUND
 */

export function getPremium(
  token: string,
  { refresh = false }: { refresh?: boolean } = {},
): Promise<ApiResult<PremiumView>> {
  return apiRequest<PremiumView>("/v1/billing/premium", {
    method: "GET",
    token,
    params: refresh ? { refresh: "1" } : undefined,
  });
}

export function startPremiumCheckout(
  token: string,
  body: PremiumCheckoutRequest,
): Promise<ApiResult<CheckoutResponse>> {
  return apiRequest<CheckoutResponse>("/v1/billing/premium/checkout", {
    method: "POST",
    token,
    data: body,
  });
}

export function cancelPremium(token: string): Promise<ApiResult<PremiumView>> {
  return apiRequest<PremiumView>("/v1/billing/premium/cancel", {
    method: "POST",
    token,
  });
}

export function listPointsPackages(
  token: string,
): Promise<ApiResult<PointsPackagesResponse>> {
  return apiRequest<PointsPackagesResponse>("/v1/billing/points/packages", {
    method: "GET",
    token,
  });
}

export function getPointsOverview(
  token: string,
  limit: number = BILLING_HISTORY_MAX_LIMIT,
): Promise<ApiResult<PointsOverview>> {
  return apiRequest<PointsOverview>(`/v1/billing/points?limit=${limit}`, {
    method: "GET",
    token,
  });
}

export function startPointsCheckout(
  token: string,
  body: PointsCheckoutRequest,
): Promise<ApiResult<CheckoutResponse>> {
  return apiRequest<CheckoutResponse>("/v1/billing/points/checkout", {
    method: "POST",
    token,
    data: body,
  });
}

export function getPurchase(
  token: string,
  purchaseId: string,
): Promise<ApiResult<PointPurchase>> {
  return apiRequest<PointPurchase>(
    `/v1/billing/purchases/${encodeURIComponent(purchaseId)}`,
    { method: "GET", token },
  );
}
