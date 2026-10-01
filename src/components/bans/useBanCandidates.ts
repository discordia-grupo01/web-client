"use client";

import { type Member } from "@discordia/client-shared";

import { useEffect, useMemo, useState } from "react";

import { useProfileFallback } from "@/hooks/useProfileFallback";
import { listMembersRequest } from "@/services/members/client";

interface UseBanCandidatesOptions {
  serverId: string;
  ownerId: string;
  currentUserId: string | null;
  /** No pide nada hasta que la pestaña se abre por primera vez. */
  enabled: boolean;
}

/**
 * Miembros que se pueden ofrecer para banear: todos menos el propietario y
 * uno mismo. La jerarquia de roles no se evalua aca (el front no conoce la
 * posicion de los roles): si el objetivo tiene un rol igual o superior, el
 * back rechaza el baneo y el modal lo muestra.
 */
export function useBanCandidates({
  serverId,
  ownerId,
  currentUserId,
  enabled,
}: UseBanCandidatesOptions) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setMembers(null);
    setErrorMessage("");

    listMembersRequest(serverId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        setMembers([]);
        return;
      }
      setMembers(result.members);
    });

    return () => {
      cancelled = true;
    };
  }, [serverId, enabled]);

  const eligible = useMemo(
    () =>
      members?.filter(
        (member) =>
          member.user_id !== ownerId && member.user_id !== currentUserId,
      ) ?? null,
    [members, ownerId, currentUserId],
  );

  const candidates = useProfileFallback(eligible);

  return { candidates, errorMessage };
}
