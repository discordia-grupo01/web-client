"use client";

import type { Boost } from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import {
  getPointsOverviewRequest,
  listBoostsRequest,
} from "@/services/billing/client";

export type OwnBoostsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; boosts: Boost[]; balance: number };

/** Mis boosts de todos los servidores y el saldo de puntos para boostear. */
export function useOwnBoosts() {
  const [state, setState] = useState<OwnBoostsState>({ status: "loading" });
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    const [boosts, points] = await Promise.all([
      listBoostsRequest(),
      getPointsOverviewRequest(),
    ]);
    if (requestId !== latestRequest.current) return;
    if (!boosts.ok || !points.ok) {
      const message = boosts.ok
        ? points.ok
          ? ""
          : points.message
        : boosts.message;
      // Si ya había datos, un fallo al refrescar no los tapa con un error.
      setState((current) =>
        current.status === "ready" ? current : { status: "error", message },
      );
      return;
    }
    setState({
      status: "ready",
      boosts: boosts.data,
      balance: Math.max(0, points.data.balance),
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRefreshOnChange({ resources: ["boosts", "points"] }, load);

  const replaceBoost = useCallback((boost: Boost) => {
    setState((current) =>
      current.status === "ready"
        ? {
            ...current,
            boosts: current.boosts.map((item) =>
              item.id === boost.id ? boost : item,
            ),
          }
        : current,
    );
  }, []);

  return { state, reload: load, replaceBoost };
}

export type OwnBoosts = ReturnType<typeof useOwnBoosts>;
