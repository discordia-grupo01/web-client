"use client";

import {
  authorFromMember,
  buildMentionResolver,
  type MentionSources,
  type Member,
  type MessageAuthor,
  type Role,
} from "@discordia/client-shared";
import { useMemo } from "react";

import { avatarSrcOf } from "@/utils/userProfile";

import type { MessageMentionsValue } from "@/contexts/MentionsContext";

interface MentionsInput {
  members: Member[] | null;
  authors: Record<string, MessageAuthor>;
  serverRoles: Role[];
  canMentionEveryone: boolean;
  currentUserId: string | null;
  myRoleIds: readonly string[];
}

/** Lo que `MessageMentionsProvider` necesita para un chat de servidor. */
export function useMessageMentionsValue({
  members,
  authors,
  serverRoles,
  canMentionEveryone,
  currentUserId,
  myRoleIds,
}: MentionsInput): MessageMentionsValue {
  return useMemo<MessageMentionsValue>(() => {
    const sources: MentionSources = {
      members: (members ?? []).map((member) =>
        authorFromMember(
          member,
          avatarSrcOf(member.user_id, member.profile),
          serverRoles,
        ),
      ),
      roles: serverRoles,
      canMentionEveryone,
    };
    return {
      resolveMention: buildMentionResolver(authors, serverRoles),
      sources,
      me: { userId: currentUserId, roleIds: myRoleIds },
    };
  }, [
    authors,
    members,
    serverRoles,
    canMentionEveryone,
    currentUserId,
    myRoleIds,
  ]);
}
