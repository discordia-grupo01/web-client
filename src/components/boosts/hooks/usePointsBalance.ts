"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { getPointsOverviewRequest } from "@/services/billing/client";

export type PointsBalanceState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; balance: number };

export function usePointsBalance() {
  const [state, setState] = useState<PointsBalanceState>({
    status: "loading",
  });
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    const result = await getPointsOverviewRequest();
    if (requestId !== latestRequest.current) return;
    if (!result.ok) {
      setState((current) =>
        current.status === "ready"
          ? current
          : { status: "error", message: result.message },
      );
      return;
    }
    setState({ status: "ready", balance: Math.max(0, result.data.balance) });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRefreshOnChange({ resources: ["points"] }, load);

  return { state, reload: load };
}

export type PointsBalance = ReturnType<typeof usePointsBalance>;
