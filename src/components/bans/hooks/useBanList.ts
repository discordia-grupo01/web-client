"use client";

import {
  type Ban,
  type MemberPageQuery,
  type UnbanMemberResult,
} from "@discordia/client-shared";

import { useCallback, useEffect, useState } from "react";

import { usePagedList } from "@/hooks/usePagedList";
import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { listBansRequest, unbanMemberRequest } from "@/services/bans/client";

/**
 * Los baneados de un servidor, de a una pagina del back y filtrados por nombre
 * en el back. Cada uno trae el perfil del usuario (el del baneo, o
 * `GET /users/:id` si todavia no se replico).
 */
export function useBanList(serverId: string, search: string) {
  const fetchPage = useCallback(
    async (query: MemberPageQuery) => {
      const result = await listBansRequest(serverId, query);
      return result.ok
        ? { ok: true as const, items: result.bans, total: result.total }
        : result;
    },
    [serverId],
  );
  const pages = usePagedList<Ban>({ fetchPage, search });
  const { items, page, setPage, total, isSearching, reload } = pages;

  // El total de la pestaña es el de todos los baneados, no el de la búsqueda.
  const [allTotal, setAllTotal] = useState(0);
  useEffect(() => {
    if (!isSearching) setAllTotal(total);
  }, [isSearching, total]);

  useRefreshOnChange({ resources: ["moderation"], serverId }, reload);

  const unban = useCallback(
    async (userId: string): Promise<UnbanMemberResult> => {
      const result = await unbanMemberRequest(serverId, userId);
      if (!result.ok) return result;
      // Si era el último de la página, la página ya no existe: vuelve a la anterior.
      if (items?.length === 1 && page > 1) setPage(page - 1);
      else reload();
      return result;
    },
    [serverId, items, page, setPage, reload],
  );

  return { ...pages, bans: items, allTotal, unban };
}
