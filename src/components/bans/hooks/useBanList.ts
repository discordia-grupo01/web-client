"use client";

import { type Ban, type UnbanMemberResult } from "@discordia/client-shared";

import { useCallback, useEffect, useState } from "react";

import { useProfileFallback } from "@/hooks/useProfileFallback";
import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { listBansRequest, unbanMemberRequest } from "@/services/bans/client";

/**
 * Lista completa de baneados de un servidor, cada uno con el perfil del
 * usuario (el del baneo, o `GET /users/:id` si todavia no se replico).
 * `bans` es `null` mientras carga. La busqueda y la paginacion las hace quien
 * lo usa, sobre esta lista.
 */
export function useBanList(serverId: string) {
  const [loadedBans, setLoadedBans] = useState<Ban[] | null>(null);
  const bans = useProfileFallback(loadedBans);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadedBans(null);
    setErrorMessage("");

    listBansRequest(serverId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        setLoadedBans([]);
        return;
      }
      setLoadedBans(result.bans);
    });

    return () => {
      cancelled = true;
    };
  }, [serverId]);

  const refreshBans = useCallback(async () => {
    const result = await listBansRequest(serverId);
    if (result.ok) setLoadedBans(result.bans);
  }, [serverId]);

  useRefreshOnChange({ resources: ["moderation"], serverId }, refreshBans);

  const unban = useCallback(
    async (userId: string): Promise<UnbanMemberResult> => {
      const result = await unbanMemberRequest(serverId, userId);
      if (result.ok) {
        setLoadedBans(
          (prev) => prev?.filter((ban) => ban.user_id !== userId) ?? prev,
        );
      }
      return result;
    },
    [serverId],
  );

  return { bans, errorMessage, unban };
}
