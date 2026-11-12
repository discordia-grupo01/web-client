"use client";

import {
  type MessageAuthor,
  messageAuthorOf,
  type NotificationHistoryItem,
  notificationUserIds,
} from "@discordia/client-shared";

import { useEffect, useRef, useState } from "react";

import { useProfileChanges } from "@/hooks/useProfileChanges";
import { getPublicProfileRequest } from "@/services/profile/client";
import { avatarSrcOf } from "@/utils/userProfile";

export function useNotificationAuthors(
  items: readonly NotificationHistoryItem[],
): Record<string, MessageAuthor> {
  const [authors, setAuthors] = useState<Record<string, MessageAuthor>>({});
  const requested = useRef(new Set<string>());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useProfileChanges(
    (id) => requested.current.has(id),
    (user) =>
      setAuthors((previous) => ({
        ...previous,
        [user.id]: messageAuthorOf(
          user.id,
          user.name,
          avatarSrcOf(user.id, user),
        ),
      })),
  );

  useEffect(() => {
    const missing = [...new Set(items.flatMap(notificationUserIds))].filter(
      (id) => !requested.current.has(id),
    );
    missing.forEach((id) => requested.current.add(id));

    missing.forEach((id) => {
      void getPublicProfileRequest(id).then((result) => {
        if (!isMounted.current || !result.ok) return;
        const { user } = result;
        setAuthors((previous) => ({
          ...previous,
          [id]: messageAuthorOf(user.id, user.name, avatarSrcOf(user.id, user)),
        }));
      });
    });
  }, [items]);

  return authors;
}
