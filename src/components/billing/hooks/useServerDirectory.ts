"use client";

import type { ServerSummary } from "@discordia/client-shared";

import { useCallback, useEffect, useState } from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { listServersRequest } from "@/services/servers/client";

type ServerDirectory = Map<string, ServerSummary>;

export function useServerDirectory() {
  const [servers, setServers] = useState<ServerDirectory | null>(null);

  const load = useCallback(async () => {
    const result = await listServersRequest();
    if (!result.ok) {
      // Sin lista no se puede nombrar ningún servidor: se muestran como desconocidos.
      setServers((current) => current ?? new Map());
      return;
    }
    setServers(new Map(result.servers.map((server) => [server.id, server])));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRefreshOnChange({ resources: ["servers", "server", "boosts"] }, load);

  return servers;
}
