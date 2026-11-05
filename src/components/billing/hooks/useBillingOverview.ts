"use client";

import {
  BILLING_LOAD_FAILED,
  type PointsOverview,
  type PointsPackage,
  type PremiumView,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getPointsOverviewRequest,
  getPremiumRequest,
  listPointsPackagesRequest,
} from "@/services/billing/client";

export type BillingOverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      premium: PremiumView;
      points: PointsOverview;
      packages: PointsPackage[];
    };

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
    if (!mounted.current) return;

    if (!premium.ok || !points.ok || !packages.ok) {
      const failed = !premium.ok ? premium : !points.ok ? points : packages;
      setState({
        status: "error",
        message: failed.ok ? BILLING_LOAD_FAILED : failed.message,
      });
      return;
    }
    setState({
      status: "ready",
      premium: premium.premium,
      points: points.points,
      packages: packages.packages,
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const setPremium = useCallback((premium: PremiumView) => {
    setState((current) =>
      current.status === "ready" ? { ...current, premium } : current,
    );
  }, []);

  return { state, reload: load, setPremium };
}
