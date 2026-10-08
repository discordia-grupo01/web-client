"use client";

import {
  dmCandidatesFrom,
  type Member,
  type MessageAuthor,
  type ServerSummary,
} from "@discordia/client-shared";

import { useEffect, useMemo, useState } from "react";

import { useProfileFallback } from "@/hooks/useProfileFallback";
import { avatarSrcOf } from "@/lib/userProfile";
import { listMembersRequest } from "@/services/members/client";

/**
 * A quien se le puede escribir (ver `dmCandidatesFrom`). Solo pide los
 * miembros cuando `enabled` (al abrir el modal de nuevo DM).
 */
export function useDmCandidates(
  servers: ServerSummary[],
  currentUserId: string | null,
  enabled: boolean,
): { candidates: MessageAuthor[]; isLoading: boolean } {
  const serversKey = servers.map((server) => server.id).join(",");
  const [loaded, setLoaded] = useState<{
    serversKey: string;
    members: Member[];
  } | null>(null);
  // Lo cargado para otros servidores no vale: hasta que llegue lo nuevo, "cargando".
  const members =
    enabled && loaded?.serversKey === serversKey ? loaded.members : null;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void Promise.all(servers.map((s) => listMembersRequest(s.id))).then(
      (results) => {
        if (cancelled) return;
        setLoaded({
          serversKey,
          members: results.flatMap((result) =>
            result.ok ? result.members : [],
          ),
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, servers, serversKey]);

  const withProfiles = useProfileFallback(members);

  const candidates = useMemo(
    () =>
      dmCandidatesFrom(withProfiles ?? [], currentUserId, (member) =>
        avatarSrcOf(member.user_id, member.profile),
      ),
    [withProfiles, currentUserId],
  );

  return { candidates, isLoading: enabled && members === null };
}
