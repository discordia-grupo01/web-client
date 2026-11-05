"use client";

import {
  PAYMENT_RETURN_POLL_MS,
  PAYMENT_RETURN_TIMEOUT_MS,
  PAYMENT_STATUS_FAILED,
  type PaymentProgress,
  type PaymentReturnParams,
  type PointPurchase,
  pointsPaymentProgress,
  premiumPaymentProgress,
  type PremiumView,
} from "@discordia/client-shared";

import { useCallback, useEffect, useState } from "react";

import {
  getPointsOverviewRequest,
  getPremiumRequest,
  getPurchaseRequest,
} from "@/services/billing/client";

export interface PaymentReturnState {
  progress: PaymentProgress;
  purchase: PointPurchase | null;
  premium: PremiumView | null;
  balance: number | null;
  error: string | null;
}

const VERIFYING: PaymentReturnState = {
  progress: { outcome: "verifying", done: false },
  purchase: null,
  premium: null,
  balance: null,
  error: null,
};

const INVALID_RETURN: PaymentReturnState = {
  ...VERIFYING,
  progress: { outcome: "points_not_found", done: true },
};

type Step =
  { kind: "progress"; state: PaymentReturnState } | { kind: "failed" };

async function checkPoints(
  purchaseId: string,
  elapsedMs: number,
): Promise<Step> {
  const result = await getPurchaseRequest(purchaseId);
  if (!result.ok && result.code !== "PURCHASE_NOT_FOUND") {
    return { kind: "failed" };
  }
  const purchase = result.ok ? result.purchase : null;
  const progress = pointsPaymentProgress(purchase, elapsedMs);

  let balance: number | null = null;
  if (progress.outcome === "points_accredited") {
    const overview = await getPointsOverviewRequest();
    if (overview.ok) balance = overview.points.balance;
  }
  return {
    kind: "progress",
    state: { ...VERIFYING, progress, purchase, balance },
  };
}

async function checkPremium(elapsedMs: number): Promise<Step> {
  const result = await getPremiumRequest({ refresh: true });
  if (!result.ok) return { kind: "failed" };
  return {
    kind: "progress",
    state: {
      ...VERIFYING,
      progress: premiumPaymentProgress(result.premium, elapsedMs),
      premium: result.premium,
    },
  };
}

export function usePaymentReturn(params: PaymentReturnParams | null) {
  const [state, setState] = useState<PaymentReturnState>(
    params ? VERIFYING : INVALID_RETURN,
  );
  const [attempt, setAttempt] = useState(0);
  const kind = params?.kind;
  const purchaseId = params?.purchaseId ?? null;

  useEffect(() => {
    if (!kind) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    setState(VERIFYING);

    async function tick() {
      const elapsed = Date.now() - startedAt;
      const step =
        kind === "points" && purchaseId
          ? await checkPoints(purchaseId, elapsed)
          : await checkPremium(elapsed);
      if (cancelled) return;

      if (step.kind === "progress") {
        setState(step.state);
        if (step.state.progress.done) return;
      } else if (elapsed >= PAYMENT_RETURN_TIMEOUT_MS) {
        setState((current) => ({
          ...current,
          progress: { ...current.progress, done: true },
          error: PAYMENT_STATUS_FAILED,
        }));
        return;
      }
      timer = setTimeout(() => void tick(), PAYMENT_RETURN_POLL_MS);
    }

    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [kind, purchaseId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, retry };
}
