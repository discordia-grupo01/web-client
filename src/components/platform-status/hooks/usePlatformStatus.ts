"use client";

import type { PlatformStatusResponse } from "@discordia/client-shared";
import { useCallback, useEffect, useState } from "react";

import { getPlatformStatusRequest } from "@/services/platform-status/client";

export type PlatformStatusState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; data: PlatformStatusResponse };

export function usePlatformStatus(refreshSignal = 0) {
  const [state, setState] = useState<PlatformStatusState>({
    phase: "loading",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPlatformStatusRequest().then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? {
              phase: "ready",
              data: { status: result.status, incidents: result.incidents },
            }
          : { phase: "error", message: result.message },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [attempt, refreshSignal]);

  const retry = useCallback(() => {
    setState({ phase: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return { state, retry };
}
