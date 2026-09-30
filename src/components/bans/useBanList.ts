"use client";

import { type Ban, type UnbanMemberResult } from "@discordia/client-shared";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useUserProfiles } from "@/hooks/useUserProfiles";
import { listBansRequest, unbanMemberRequest } from "@/services/bans/client";

/**
 * Lista completa de baneados de un servidor + los perfiles de esos usuarios
 * (el back solo devuelve el `user_id`). `bans` es `null` mientras carga. La
 * busqueda y la paginacion las hace quien lo usa, sobre esta lista.
 */
export function useBanList(serverId: string) {
  const [bans, setBans] = useState<Ban[] | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const userIds = useMemo(() => bans?.map((ban) => ban.user_id) ?? [], [bans]);
  const profiles = useUserProfiles(userIds);

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

  return { bans, profiles, errorMessage, unban };
}
