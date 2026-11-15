"use client";

import {
  type BillingOverviewState,
  type PremiumView,
  toBillingOverview,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import {
  getPointsOverviewRequest,
  getPremiumRequest,
  listPointsPackagesRequest,
} from "@/services/billing/client";

export function useBillingOverview() {
  const [state, setState] = useState<BillingOverviewState>({
    status: "loading",
  });
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setState((current) =>
      current.status === "ready" ? current : { status: "loading" },
    );
    const [premium, points, packages] = await Promise.all([
      getPremiumRequest(),
      getPointsOverviewRequest(),
      listPointsPackagesRequest(),
    ]);
    const next = toBillingOverview(premium, points, packages);
    if (!mounted.current) return;
    setState((current) =>
      next.status === "error" && current.status === "ready" ? current : next,
    );
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  useRefreshOnChange(
    { resources: ["points", "purchases", "premium", "boosts"] },
    load,
  );

  const setPremium = useCallback((premium: PremiumView) => {
    setState((current) =>
      current.status === "ready" ? { ...current, premium } : current,
    );
  }, []);

  return { state, reload: load, setPremium };
}
