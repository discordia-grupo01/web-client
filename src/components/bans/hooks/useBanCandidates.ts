"use client";

import {
  eligibleBanCandidates,
  type MemberPageQuery,
} from "@discordia/client-shared";

import { useCallback, useMemo } from "react";

import { useMemberPages } from "@/hooks/useMemberPages";
import { listMembersRequest } from "@/services/members/client";

interface UseBanCandidatesOptions {
  serverId: string;
  ownerId: string;
  currentUserId: string | null;
  search: string;
}

/**
 * Miembros que se pueden ofrecer para banear (ver `eligibleBanCandidates`),
 * de a una pagina del back. El propietario y uno mismo se sacan de la pagina,
 * asi que esa pagina muestra uno menos.
 */
export function useBanCandidates({
  serverId,
  ownerId,
  currentUserId,
  search,
}: UseBanCandidatesOptions) {
  const fetchPage = useCallback(
    (query: MemberPageQuery) => listMembersRequest(serverId, query),
    [serverId],
  );
  const list = useMemberPages({ fetchPage, search });

  const candidates = useMemo(
    () =>
      list.members
        ? eligibleBanCandidates(list.members, ownerId, currentUserId)
        : null,
    [list.members, ownerId, currentUserId],
  );

  return { ...list, candidates };
}
