"use client";

import {
  PENDING_REPORTS_POLL_MS,
  type PendingReportsCount,
} from "@discordia/client-shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { pendingReportsCountRequest } from "@/services/reports/client";

type FetchCount = (serverId: string) => Promise<PendingReportsCount>;

/**
 * Reportes pendientes por servidor, para la bandera del riel. No hay aviso en
 * tiempo real cuando alguien reporta: se vuelve a pedir cada minuto con la
 * pestaña visible y al volver a ella. Quien no es moderador recibe 0 (lo
 * resuelve el BFF sin pegarle al endpoint que daria 403). Un fallo conserva
 * el ultimo valor.
 */
export function usePendingReports(
  serverIds: readonly string[],
  fetchCount: FetchCount = pendingReportsCountRequest,
) {
  const [byServer, setByServer] = useState<Record<string, number>>({});
  const idsRef = useRef(serverIds);
  idsRef.current = serverIds;
  const key = serverIds.join(",");

  const refresh = useCallback(
    async (only?: string) => {
      const ids = only ? [only] : idsRef.current;
      const results = await Promise.all(
        ids.map(async (id) => [id, (await fetchCount(id)).total] as const),
      );
      setByServer((current) => {
        const next = { ...current };
        for (const [id, total] of results) {
          if (total !== null) next[id] = total;
        }
        return next;
      });
    },
    [fetchCount],
  );

  useEffect(() => {
    if (key === "") return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    void refresh();
    const interval = window.setInterval(
      refreshIfVisible,
      PENDING_REPORTS_POLL_MS,
    );
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [key, refresh]);

  return { byServer, refresh };
}
