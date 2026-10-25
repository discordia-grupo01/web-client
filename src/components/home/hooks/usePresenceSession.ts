"use client";

import {
  changeOwnStatus,
  createPresenceStore,
  type UserRoomCallbacks,
  type UserRoomPush,
} from "@discordia/client-shared";
import { useMemo } from "react";

import type { PresenceContextValue } from "@/contexts/PresenceContext";

export function usePresenceSession(currentUserId: string | null) {
  const store = useMemo(
    () => createPresenceStore(currentUserId),
    [currentUserId],
  );
  const userRoomCallbacks = useMemo<UserRoomCallbacks>(
    () => ({
      onJoined: store.userRoomJoined,
      onConnectionLost: store.userRoomLost,
      onPresenceUpdated: (entry) => store.applyEntries([entry]),
      onOwnStatusUpdated: store.ownStatusUpdated,
    }),
    [store],
  );
  return { store, userRoomCallbacks };
}

export function usePresenceProviderValue(
  store: PresenceContextValue["store"],
  push: UserRoomPush,
): PresenceContextValue {
  return useMemo(
    () => ({
      store,
      setOwnStatus: (choice) => changeOwnStatus(store, push, choice),
    }),
    [store, push],
  );
}
