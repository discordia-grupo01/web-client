"use client";

import { type MemberPageQuery } from "@discordia/client-shared";

import { useCallback, useMemo } from "react";

import { useMemberPages } from "@/hooks/useMemberPages";
import { listMembersRequest } from "@/services/members/client";

interface UseBanCandidatesOptions {
  serverId: string;
  ownerId: string;
  currentUserId: string | null;
  search: string;
  /** No pide nada hasta que la pestaña se abre por primera vez. */
  enabled: boolean;
}

/**
 * Miembros que se pueden ofrecer para banear, de a una pagina del back: todos
 * menos el propietario y uno mismo (que se sacan de la pagina, asi que esa
 * pagina muestra uno menos). La jerarquia de roles no se evalua aca (el front
 * no conoce la posicion de los roles): si el objetivo tiene un rol igual o
 * superior, el back rechaza el baneo y el modal lo muestra.
 */
export function useBanCandidates({
  serverId,
  ownerId,
  currentUserId,
  search,
  enabled,
}: UseBanCandidatesOptions) {
  const fetchPage = useCallback(
    (query: MemberPageQuery) => listMembersRequest(serverId, query),
    [serverId],
  );
  const pages = useMemberPages({ fetchPage, search, enabled });

  const candidates = useMemo(
    () =>
      pages.members?.filter(
        (member) =>
          member.user_id !== ownerId && member.user_id !== currentUserId,
      ) ?? null,
    [pages.members, ownerId, currentUserId],
  );

  return { ...pages, candidates };
}
