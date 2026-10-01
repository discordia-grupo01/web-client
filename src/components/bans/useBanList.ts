"use client";

import { type Ban, type UnbanMemberResult } from "@discordia/client-shared";

import { useCallback, useEffect, useState } from "react";

import { listBansRequest, unbanMemberRequest } from "@/services/bans/client";

/**
 * Lista completa de baneados de un servidor (cada baneo trae el perfil del
 * usuario). `bans` es `null` mientras carga. La
 * busqueda y la paginacion las hace quien lo usa, sobre esta lista.
 */
export function useBanList(serverId: string) {
  const [bans, setBans] = useState<Ban[] | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setBans(null);
    setErrorMessage("");

    listBansRequest(serverId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        setBans([]);
        return;
      }
      setBans(result.bans);
    });

    return () => {
      cancelled = true;
    };
  }, [serverId]);

  const unban = useCallback(
    async (userId: string): Promise<UnbanMemberResult> => {
      const result = await unbanMemberRequest(serverId, userId);
      if (result.ok) {
        setBans(
          (prev) => prev?.filter((ban) => ban.user_id !== userId) ?? prev,
        );
      }
      return result;
    },
    [serverId],
  );

  return { bans, errorMessage, unban };
}
