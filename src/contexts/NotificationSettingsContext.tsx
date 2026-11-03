"use client";

import type {
  NotificationSettings,
  NotificationSettingsPatch,
} from "@discordia/client-shared";

import { createContext, type ReactNode, useContext, useMemo } from "react";

import {
  type SaveNotificationSettingResult,
  useNotificationSettings,
} from "@/hooks/useNotificationSettings";

export interface NotificationSettingsValue {
  settings: NotificationSettings;
  setChannel: (
    channelId: string,
    patch: NotificationSettingsPatch,
  ) => Promise<SaveNotificationSettingResult>;
  setServer: (
    serverId: string,
    patch: NotificationSettingsPatch,
  ) => Promise<SaveNotificationSettingResult>;
}

const NotificationSettingsContext =
  createContext<NotificationSettingsValue | null>(null);

export function NotificationSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { settings, setChannel, setServer } = useNotificationSettings();
  const value = useMemo(
    () => ({ settings, setChannel, setServer }),
    [settings, setChannel, setServer],
  );

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
}

export function useOptionalNotificationSettings(): NotificationSettingsValue | null {
  return useContext(NotificationSettingsContext);
}
