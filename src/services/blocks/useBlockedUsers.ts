"use client";

import type { BlockUserResult } from "@discordia/client-shared";

import { useCallback, useEffect, useState } from "react";

import {
  blockUserRequest,
  listBlocksRequest,
  unblockUserRequest,
} from "./client";

export function useBlockedUsers(currentUserId: string | null) {
  const [blockedIds, setBlockedIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    listBlocksRequest().then((result) => {
      if (!cancelled && result.ok) {
        setBlockedIds(new Set(result.blockedUserIds));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const setBlocked = useCallback(
    async (userId: string, blocked: boolean): Promise<BlockUserResult> => {
      const result = blocked
        ? await blockUserRequest(userId)
        : await unblockUserRequest(userId);
      if (result.ok) {
        setBlockedIds((prev) => {
          const next = new Set(prev);
          if (blocked) next.add(userId);
          else next.delete(userId);
          return next;
        });
      }
      return result;
    },
    [],
  );

  return {
    blockedIds,
    blockUser: useCallback(
      (userId: string) => setBlocked(userId, true),
      [setBlocked],
    ),
    unblockUser: useCallback(
      (userId: string) => setBlocked(userId, false),
      [setBlocked],
    ),
  };
}
