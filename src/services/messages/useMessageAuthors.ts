"use client";

import {
  authorFromMember,
  type Member,
  type Message,
  type MessageAuthor,
  messageAuthorOf,
  PROFILE_FALLBACK_CONCURRENCY,
} from "@discordia/client-shared";

import { useEffect, useMemo, useRef, useState } from "react";

import { useProfileFallback } from "@/hooks/useProfileFallback";
import { avatarSrcOf } from "@/lib/userProfile";
import { listMembersRequest } from "@/services/members/client";
import { getPublicProfileRequest } from "@/services/profile/client";

/**
 * `user_id` -> autor listo para pintar. El mensaje solo trae el `user_id`, asi
 * que se cruza con los miembros del servidor (nombre y avatar). Quien ya no es
 * miembro, o no entro en la primera pagina de miembros, se pide como perfil
 * publico, una sola vez por id; mientras tanto (o si falla) la lista muestra
 * "Usuario desconocido".
 *
 * `currentAuthor` pisa a los demas: es el perfil propio, siempre mas fresco que
 * la copia del miembro.
 */
export function useMessageAuthors(
  serverId: string,
  messages: Message[] | null,
  currentAuthor: MessageAuthor | null,
): Record<string, MessageAuthor> {
  const [loadedMembers, setLoadedMembers] = useState<Member[] | null>(null);
  const members = useProfileFallback(loadedMembers);
  const [extra, setExtra] = useState<Record<string, MessageAuthor>>({});
  const requested = useRef(new Set<string>());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listMembersRequest(serverId).then((result) => {
      if (!cancelled) setLoadedMembers(result.ok ? result.members : []);
    });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  const base = useMemo(() => {
    const byId: Record<string, MessageAuthor> = { ...extra };
    for (const member of members ?? []) {
      byId[member.user_id] = authorFromMember(
        member,
        avatarSrcOf(member.user_id, member.profile),
      );
    }
    if (currentAuthor) byId[currentAuthor.id] = currentAuthor;
    return byId;
  }, [members, extra, currentAuthor]);

  // Se espera a tener los miembros: antes de eso todo autor "falta" y se
  // pediria un perfil por cada uno sin necesidad.
  useEffect(() => {
    if (!messages || loadedMembers === null) return;

    const queue = [
      ...new Set(messages.map((message) => message.user_id)),
    ].filter((id) => !base[id] && !requested.current.has(id));
    queue.forEach((id) => requested.current.add(id));

    async function worker() {
      while (queue.length > 0 && isMounted.current) {
        const result = await getPublicProfileRequest(queue.shift() as string);
        if (result.ok && isMounted.current) {
          const { id, name, avatar_url } = result.user;
          setExtra((prev) => ({
            ...prev,
            [id]: messageAuthorOf(
              id,
              name,
              avatarSrcOf(id, { name, avatar_url }),
            ),
          }));
        }
      }
    }
    void Promise.all(
      Array.from({ length: PROFILE_FALLBACK_CONCURRENCY }, worker),
    );
  }, [messages, loadedMembers, base]);

  return base;
}
