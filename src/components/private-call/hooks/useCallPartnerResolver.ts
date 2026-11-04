"use client";

import {
  type ConversationSummary,
  type PrivateCallPartner,
  UNKNOWN_USER_NAME,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef } from "react";

import { getPublicProfileRequest } from "@/services/profile/client";
import { avatarSrcOf } from "@/utils/userProfile";

export function useCallPartnerResolver(
  conversations: readonly ConversationSummary[],
): (userId: string) => Promise<PrivateCallPartner> {
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  return useCallback(async (userId: string) => {
    const listed = conversationsRef.current.find(
      (conversation) => conversation.partner.id === userId,
    )?.partner;
    if (listed) {
      return { id: userId, name: listed.name, avatarUrl: listed.avatarUrl };
    }

    const result = await getPublicProfileRequest(userId);
    if (!result.ok) {
      return { id: userId, name: UNKNOWN_USER_NAME, avatarUrl: null };
    }
    return {
      id: userId,
      name: result.user.name,
      avatarUrl: avatarSrcOf(userId, {
        name: result.user.name,
        avatar_url: result.user.avatar_url,
      }),
    };
  }, []);
}
