"use client";

import { collectAllPages, type Member } from "@discordia/client-shared";

import { useEffect, useState } from "react";

import { useProfileFallback } from "@/hooks/useProfileFallback";

import { listMembersRequest } from "./client";

/**
 * Todos los miembros del servidor (se juntan las paginas de 100 del back) con
 * el perfil completado cuando el back todavia no lo replico. `null` mientras
 * carga; si falla queda en `[]`, asi lo que depende de la lista sigue andando
 * con lo que tenga.
 */
export function useServerMembers(serverId: string): Member[] | null {
  const [loaded, setLoaded] = useState<Member[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    collectAllPages<Member>(async (offset) => {
      const result = await listMembersRequest(serverId, offset);
      return result.ok
        ? {
            ok: true,
            status: 200,
            data: { items: result.members, total: result.total },
          }
        : {
            ok: false,
            status: 0,
            code: "MEMBERS_LOAD_FAILED",
            message: result.message,
          };
    }).then((result) => {
      if (!cancelled) setLoaded(result.ok ? result.data.items : []);
    });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  return useProfileFallback(loaded);
}
