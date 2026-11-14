"use client";

import type { ServerBoostSummary } from "@discordia/client-shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { getServerBoostSummaryRequest } from "@/services/servers/client";

export function useServerBoostSummary(serverId: string) {
  const [summary, setSummary] = useState<ServerBoostSummary | null>(null);
  const [loadError, setLoadError] = useState("");
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    const result = await getServerBoostSummaryRequest(serverId);
    if (requestId !== latestRequest.current) return;
    if (!result.ok) {
      setLoadError(result.message);
      return;
    }
    setLoadError("");
    setSummary(result.summary);
  }, [serverId]);

  useEffect(() => {
    setSummary(null);
    setLoadError("");
    void load();
  }, [load]);

  useRefreshOnChange({ resources: ["server"], serverId }, load);

  return { summary, loadError, retry: load };
}
