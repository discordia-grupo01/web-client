"use client";

import { NOTIFICATION_REFRESH_RETRY_DELAYS_MS } from "@discordia/client-shared";

import { useEffect, useRef } from "react";

export function useNotificationRefreshOnSignal(
  signal: number,
  refresh: () => Promise<boolean>,
  delays: readonly number[] = NOTIFICATION_REFRESH_RETRY_DELAYS_MS,
) {
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (signal === 0) return;

    let isCancelled = false;
    let timer: number | undefined;

    const attempt = (index: number) => {
      timer = window.setTimeout(() => {
        void refreshRef.current().then((found) => {
          if (isCancelled || found || index + 1 >= delays.length) return;
          attempt(index + 1);
        });
      }, delays[index]);
    };

    if (delays.length > 0) attempt(0);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [signal, delays]);
}
