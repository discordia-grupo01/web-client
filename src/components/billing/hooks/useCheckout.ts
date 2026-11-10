"use client";

import {
  type CheckoutItem,
  newIdempotencyKey,
  runCheckout,
  shouldRenewIdempotencyKey,
} from "@discordia/client-shared";

import { useCallback, useRef, useState } from "react";

import {
  startPointsCheckoutRequest,
  startPremiumCheckoutRequest,
} from "@/services/billing/client";

function goToCheckout(url: string) {
  window.location.assign(url);
}

export function useCheckout({
  navigate = goToCheckout,
}: { navigate?: (url: string) => void } = {}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef(newIdempotencyKey());
  const inFlight = useRef(false);

  const start = useCallback(
    async (item: CheckoutItem, payerEmail: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setPending(true);
      setError(null);
      const outcome = await runCheckout(item, payerEmail, keyRef.current, {
        startPremium: startPremiumCheckoutRequest,
        startPoints: startPointsCheckoutRequest,
        openCheckout: navigate,
      });
      if (shouldRenewIdempotencyKey(outcome)) {
        keyRef.current = newIdempotencyKey();
      }
      if (outcome.ok) return;
      inFlight.current = false;
      setPending(false);
      setError(outcome.message);
    },
    [navigate],
  );

  const reset = useCallback(() => {
    keyRef.current = newIdempotencyKey();
    inFlight.current = false;
    setPending(false);
    setError(null);
  }, []);

  return { pending, error, start, reset };
}
