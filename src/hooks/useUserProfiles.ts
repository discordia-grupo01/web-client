"use client";

import { type PublicUser } from "@discordia/client-shared";

import { useEffect, useRef, useState } from "react";

import { getPublicProfileRequest } from "@/services/profile/client";

/** Perfiles pedidos en paralelo: el back no tiene endpoint batch. */
const CONCURRENCY = 6;

/**
 * TODO: Perfiles publicos de una lista de usuarios, resueltos de a `CONCURRENCY` en
 * segundo plano: una lista de 400 ids no dispara 400 requests de golpe y quien
 * lo usa puede pintar antes de que terminen. Solo pide los ids que todavia no
 * pidio, asi que sacar un usuario de la lista no vuelve a pedir el resto.
 * Adaptar backend !!!
 */
export function useUserProfiles(userIds: readonly string[]) {
  const [profiles, setProfiles] = useState<Record<string, PublicUser>>({});
  const requested = useRef(new Set<string>());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const queue = userIds.filter((id) => !requested.current.has(id));
    queue.forEach((id) => requested.current.add(id));

    async function worker() {
      while (queue.length > 0 && isMounted.current) {
        const result = await getPublicProfileRequest(queue.shift() as string);
        if (result.ok && isMounted.current) {
          setProfiles((prev) => ({ ...prev, [result.user.id]: result.user }));
        }
      }
    }
    void Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }, [userIds]);

  return profiles;
}
