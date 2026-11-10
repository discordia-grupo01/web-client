"use client";

import {
  PROFILE_FALLBACK_CONCURRENCY,
  voiceAvatarOf,
  type VoiceParticipantProfile,
} from "@discordia/client-shared";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getPublicProfileRequest } from "@/services/profile/client";
import { avatarSrcOf } from "@/utils/userProfile";

const cache = new Map<string, Promise<VoiceParticipantProfile | null>>();

let running = 0;
const waiting: (() => void)[] = [];

/** El back no tiene endpoint batch: de a `PROFILE_FALLBACK_CONCURRENCY`. */
async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (running >= PROFILE_FALLBACK_CONCURRENCY) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

async function fetchProfile(
  userId: string,
): Promise<VoiceParticipantProfile | null> {
  const result = await withSlot(() => getPublicProfileRequest(userId));
  if (!result.ok) {
    cache.delete(userId);
    return null;
  }
  const { name, avatar_url } = result.user;
  return {
    identity: userId,
    name,
    avatarUrl: avatarSrcOf(userId, { name, avatar_url }),
  };
}

function loadProfile(userId: string): Promise<VoiceParticipantProfile | null> {
  const cached = cache.get(userId);
  if (cached) return cached;
  const pending = fetchProfile(userId);
  cache.set(userId, pending);
  return pending;
}

export function useVoiceProfiles(userIds: readonly string[]) {
  const [byId, setById] = useState<
    Readonly<Record<string, VoiceParticipantProfile>>
  >({});
  const idsKey = userIds.join("|");

  useEffect(() => {
    let cancelled = false;
    const ids = idsKey === "" ? [] : idsKey.split("|");
    for (const id of ids) {
      void loadProfile(id).then((profile) => {
        if (cancelled || !profile) return;
        setById((current) =>
          current[id] === profile ? current : { ...current, [id]: profile },
        );
      });
    }
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const profiles = useMemo(() => Object.values(byId), [byId]);
  const avatarSrcOfIdentity = useCallback(
    (identity: string) => voiceAvatarOf(profiles, identity),
    [profiles],
  );

  return { profiles, avatarSrcOf: avatarSrcOfIdentity };
}
