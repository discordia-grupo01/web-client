"use client";

import { type MemberProfile } from "@discordia/client-shared";

import { useEffect, useMemo, useRef, useState } from "react";

import { getPublicProfileRequest } from "@/services/profile/client";

/** Perfiles pedidos en paralelo: el back no tiene endpoint batch. */
const CONCURRENCY = 6;

interface ProfiledUser {
  user_id: string;
  /** `null` mientras el back no replico el perfil de este usuario. */
  profile?: MemberProfile | null;
}

/**
 * Devuelve la misma lista (miembros o baneados) con los `profile: null`
 * completados. El back adjunta el perfil a cada usuario, asi que normalmente
 * no se pide nada. Solo para los que todavia no se replicaron desde identify
 * (no deberia pasar seguido) cae a `GET /users/:id`, de a `CONCURRENCY` en
 * segundo plano y sin repetir un id. Si ese pedido falla, el usuario queda sin
 * perfil y se muestra como "Usuario desconocido".
 *
 * Pasarle la lista tal cual (o `null` mientras carga): las pantallas siguen
 * leyendo `user.profile` sin saber de donde salio.
 */
export function useProfileFallback<T extends ProfiledUser>(
  users: readonly T[] | null,
): T[] | null {
  const [fetched, setFetched] = useState<Record<string, MemberProfile>>({});
  const requested = useRef(new Set<string>());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const queue = (users ?? [])
      .filter((user) => !user.profile && !requested.current.has(user.user_id))
      .map((user) => user.user_id);
    queue.forEach((id) => requested.current.add(id));

    async function worker() {
      while (queue.length > 0 && isMounted.current) {
        const result = await getPublicProfileRequest(queue.shift() as string);
        if (result.ok && isMounted.current) {
          const { id, name, avatar_url, description } = result.user;
          const { status_text, status_emoji } = result.user;
          setFetched((prev) => ({
            ...prev,
            [id]: { name, avatar_url, description, status_text, status_emoji },
          }));
        }
      }
    }
    void Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }, [users]);

  return useMemo(
    () =>
      users?.map((user) =>
        user.profile || !fetched[user.user_id]
          ? user
          : { ...user, profile: fetched[user.user_id] },
      ) ?? null,
    [users, fetched],
  );
}
