"use client";

import { type PublicUser, watchProfileChanges } from "@discordia/client-shared";

import { useEffect, useRef } from "react";

import { changeBus } from "@/lib/changeBus";
import { getPublicProfileRequest } from "@/services/profile/client";

export function useProfileChanges(
  isTracked: (userId: string) => boolean,
  apply: (user: PublicUser) => void,
) {
  const isTrackedRef = useRef(isTracked);
  const applyRef = useRef(apply);
  useEffect(() => {
    isTrackedRef.current = isTracked;
    applyRef.current = apply;
  }, [isTracked, apply]);

  useEffect(
    () =>
      watchProfileChanges<PublicUser>({
        bus: changeBus,
        isTracked: (userId) => isTrackedRef.current(userId),
        fetchProfile: async (userId) => {
          const result = await getPublicProfileRequest(userId);
          return result.ok ? result.user : null;
        },
        apply: (user) => applyRef.current(user),
      }),
    [],
  );
}
