"use client";

import { createContext, type RefObject, useContext } from "react";

export interface NotificationsValue {
  unreadCount: number;
  isOpen: boolean;
  anchorRef: RefObject<HTMLDivElement>;
  toggle: () => void;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

export const NotificationsProvider = NotificationsContext.Provider;

export function useOptionalNotifications(): NotificationsValue | null {
  return useContext(NotificationsContext);
}
