"use client";

import { useCallback, useState } from "react";

import {
  startPointsCheckoutRequest,
  startPremiumCheckoutRequest,
} from "@/services/billing/client";
import type { CheckoutResult } from "@/types/billing.types";

function goToCheckout(url: string) {
  window.location.assign(url);
}

export function useCheckout({
  navigate = goToCheckout,
}: { navigate?: (url: string) => void } = {}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (call: () => Promise<CheckoutResult>) => {
      setPending(true);
      setError(null);
      const result = await call();
      if (!result.ok) {
        setPending(false);
        setError(result.message);
        return;
      }
      navigate(result.checkout.checkout_url);
    },
    [navigate],
  );

  const startPremium = useCallback(
    (payerEmail: string) =>
      start(() => startPremiumCheckoutRequest(payerEmail)),
    [start],
  );

  const startPoints = useCallback(
    (packageId: string) => start(() => startPointsCheckoutRequest(packageId)),
    [start],
  );

  const reset = useCallback(() => {
    setPending(false);
    setError(null);
  }, []);

  return { pending, error, startPremium, startPoints, reset };
}
