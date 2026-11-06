import type {
  CheckoutResponse,
  PointPurchase,
  PointsOverview,
  PointsPackage,
  PremiumView,
} from "@discordia/client-shared";

export interface BillingFailure {
  ok: false;
  message: string;
  code?: string;
}

export type PremiumResult = { ok: true; premium: PremiumView } | BillingFailure;

export type PointsOverviewResult =
  { ok: true; points: PointsOverview } | BillingFailure;

export type PointsPackagesResult =
  { ok: true; packages: PointsPackage[] } | BillingFailure;

export type CheckoutResult =
  { ok: true; checkout: CheckoutResponse } | BillingFailure;

export type PurchaseResult =
  { ok: true; purchase: PointPurchase } | BillingFailure;
