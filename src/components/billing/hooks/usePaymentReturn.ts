"use client";

import {
  applyPaymentStep,
  checkPaymentStep,
  PAYMENT_RESULT_VERIFYING,
  PAYMENT_RETURN_POLL_MS,
  type PaymentResultState,
  type PaymentReturnParams,
  type PaymentStatusApi,
} from "@discordia/client-shared";

import { useCallback, useEffect, useState } from "react";

import {
  getPointsOverviewRequest,
  getPremiumRequest,
  getPurchaseRequest,
} from "@/services/billing/client";

const INVALID_RETURN: PaymentResultState = {
  ...PAYMENT_RESULT_VERIFYING,
  progress: { outcome: "points_not_found", done: true },
};

const STATUS_API: PaymentStatusApi = {
  getPurchase: getPurchaseRequest,
  getPointsOverview: getPointsOverviewRequest,
  getPremium: getPremiumRequest,
};

export function usePaymentReturn(params: PaymentReturnParams | null) {
  const [state, setState] = useState<PaymentResultState>(
    params ? PAYMENT_RESULT_VERIFYING : INVALID_RETURN,
  );
  const [attempt, setAttempt] = useState(0);
  const kind = params?.kind;
  const purchaseId = params?.purchaseId ?? null;

  useEffect(() => {
    if (!kind) return;
    const payment: PaymentReturnParams = { kind, purchaseId };
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current = PAYMENT_RESULT_VERIFYING;
    const startedAt = Date.now();
    setState(current);

    async function tick() {
      const elapsed = Date.now() - startedAt;
      const step = await checkPaymentStep(payment, elapsed, STATUS_API);
      if (cancelled) return;

      const applied = applyPaymentStep(current, step, elapsed);
      current = applied.state;
      setState(current);
      if (applied.finished) return;
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
