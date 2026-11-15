import type {
  Boost,
  BoostsResponse,
  CheckoutResponse,
  PointPurchase,
  PointsCheckoutRequest,
  PointsOverview,
  PointsPackagesResponse,
  PremiumCheckoutRequest,
  PremiumView,
} from "@discordia/client-shared";
import {
  BILLING_HISTORY_MAX_LIMIT,
  BOOSTS_LIST_MAX_LIMIT,
} from "@discordia/client-shared";

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
 *   POST /v1/billing/boosts              -> 202 Boost pending | 409 INSUFFICIENT_POINTS
 *   GET  /v1/billing/boosts?limit=       -> 200 {boosts}
 *   GET  /v1/billing/boosts/:id          -> 200 Boost | 404 BOOST_NOT_FOUND
 *   DELETE /v1/billing/boosts/:id        -> 200 Boost removed | 409 BOOST_NOT_ACTIVE
 *
 * Los dos checkouts y el boost aceptan `Idempotency-Key`: con la misma clave billing
 * devuelve el mismo checkout durante 24 h en vez de crear otra compra.
 */

function idempotencyHeaders(key: string | undefined) {
  return key ? { "Idempotency-Key": key } : undefined;
}

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
  idempotencyKey?: string,
): Promise<ApiResult<CheckoutResponse>> {
  return apiRequest<CheckoutResponse>("/v1/billing/premium/checkout", {
    method: "POST",
    token,
    data: body,
    headers: idempotencyHeaders(idempotencyKey),
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
  idempotencyKey?: string,
): Promise<ApiResult<CheckoutResponse>> {
  return apiRequest<CheckoutResponse>("/v1/billing/points/checkout", {
    method: "POST",
    token,
    data: body,
    headers: idempotencyHeaders(idempotencyKey),
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

export function requestBoost(
  token: string,
  serverId: string,
  idempotencyKey?: string,
): Promise<ApiResult<Boost>> {
  return apiRequest<Boost>("/v1/billing/boosts", {
    method: "POST",
    token,
    data: { server_id: serverId },
    headers: idempotencyHeaders(idempotencyKey),
  });
}

export function listBoosts(token: string): Promise<ApiResult<BoostsResponse>> {
  return apiRequest<BoostsResponse>(
    `/v1/billing/boosts?limit=${BOOSTS_LIST_MAX_LIMIT}`,
    { method: "GET", token },
  );
}

export function getBoost(
  token: string,
  boostId: string,
): Promise<ApiResult<Boost>> {
  return apiRequest<Boost>(
    `/v1/billing/boosts/${encodeURIComponent(boostId)}`,
    {
      method: "GET",
      token,
    },
  );
}

export function removeBoost(
  token: string,
  boostId: string,
): Promise<ApiResult<Boost>> {
  return apiRequest<Boost>(
    `/v1/billing/boosts/${encodeURIComponent(boostId)}`,
    {
      method: "DELETE",
      token,
    },
  );
}
