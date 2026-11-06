"use client";

import { type User } from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { getOwnProfileRequest } from "@/services/profile/client";

export const OWN_PROFILE_FOCUS_REFRESH_MS = 60_000;

function sameProfile(current: User | null, next: User): boolean {
  return current !== null && JSON.stringify(current) === JSON.stringify(next);
}

export function useOwnProfile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastFetchAt = useRef(0);
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    lastFetchAt.current = Date.now();
    const result = await getOwnProfileRequest();
    if (!isMounted.current) return;
    if (result.ok) {
      setProfile((current) =>
        sameProfile(current, result.user) ? current : result.user,
      );
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void refresh();
    return () => {
      isMounted.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    function refreshIfStale() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchAt.current < OWN_PROFILE_FOCUS_REFRESH_MS) {
        return;
      }
      void refresh();
    }

    document.addEventListener("visibilitychange", refreshIfStale);
    window.addEventListener("focus", refreshIfStale);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfStale);
      window.removeEventListener("focus", refreshIfStale);
    };
  }, [refresh]);

  return { profile, setProfile, isLoaded, refresh };
}
