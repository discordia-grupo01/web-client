"use client";

import {
  CHANGE_COALESCE_MS,
  CHANGE_POLL_INTERVAL_MS,
  type ChangeFilter,
  watchChanges,
} from "@discordia/client-shared";

import { useEffect, useRef } from "react";

import { changeBus } from "@/lib/changeBus";

interface RefreshOnChangeOptions {
  enabled?: boolean;
  pollMs?: number | null;
  delayMs?: number;
}

export function useRefreshOnChange(
  filter: ChangeFilter,
  refresh: () => void | Promise<unknown>,
  {
    enabled = true,
    pollMs = CHANGE_POLL_INTERVAL_MS,
    delayMs = CHANGE_COALESCE_MS,
  }: RefreshOnChangeOptions = {},
) {
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const resourcesKey = filter.resources.join(",");
  const kindsKey = filter.kinds?.join(",") ?? "";
  const { serverId, userId } = filter;

  useEffect(() => {
    if (!enabled) return;
    return watchChanges({
      bus: changeBus,
      filter: {
        resources: resourcesKey
          ? (resourcesKey.split(",") as ChangeFilter["resources"])
          : [],
        serverId,
        userId,
        kinds: kindsKey
          ? (kindsKey.split(",") as ChangeFilter["kinds"])
          : undefined,
      },
      refresh: () => refreshRef.current(),
      delayMs,
      pollMs,
      isActive: () => document.visibilityState === "visible",
      onActivate: (listener) => {
        document.addEventListener("visibilitychange", listener);
        window.addEventListener("online", listener);
        return () => {
          document.removeEventListener("visibilitychange", listener);
          window.removeEventListener("online", listener);
        };
      },
    });
  }, [enabled, pollMs, delayMs, resourcesKey, kindsKey, serverId, userId]);
}
