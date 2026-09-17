"use client";

import { useEffect, useState } from "react";

import { SectionLabel } from "@/components/ui/section-label";
import { ServerAvatar } from "@/components/ui/server-avatar";
import { listServersRequest } from "@/services/servers/client";
import type { ServerSummary } from "@/types/server.types";

interface MutualServersListProps {
  serverIds: string[];
}

/**
 * Servidores en común con el usuario del perfil público (CA1 de
 * "Visualización de perfil público"). `mutual_server_ids` solo trae ids
 * (identify-service no conoce nombre/ícono de servidor); como por
 * definición el usuario autenticado es miembro de esos servidores, se
 * resuelven cruzando contra `listServersRequest` (ya usado por el rail de
 * servidores) en vez de agregar un endpoint nuevo.
 */
export function MutualServersList({ serverIds }: MutualServersListProps) {
  const [servers, setServers] = useState<ServerSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listServersRequest().then((result) => {
      if (!cancelled && result.ok) setServers(result.servers);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const mutualServers = (servers ?? []).filter((server) =>
    serverIds.includes(server.id),
  );

  return (
    <div>
      <SectionLabel>Servidores en común</SectionLabel>
      {serverIds.length === 0 ? (
        <p className="text-content-subtle mt-1.5 text-sm">
          Sin servidores en común.
        </p>
      ) : (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {mutualServers.map((server) => (
            <div key={server.id} className="flex items-center gap-2.5 py-0.5">
              <ServerAvatar
                name={server.name}
                src={`/api/servers/${server.id}/icon`}
                size={32}
                className="shrink-0 rounded-xl"
              />
              <span className="text-content-muted truncate text-sm font-medium">
                {server.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
