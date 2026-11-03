"use client";

import {
  applyChannelNotificationSetting,
  applyServerNotificationSetting,
  channelNotificationLevel,
  isChannelMuted,
  isServerMuted,
  NO_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  type NotificationSettingsPatch,
  type NotificationSettingState,
  parseNotificationSettings,
  serverNotificationLevel,
  type UpdateNotificationSettingsResult,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  listNotificationSettingsRequest,
  updateChannelNotificationSettingsRequest,
  updateServerNotificationSettingsRequest,
} from "@/services/notifications/client";

export type NotificationSettingsStatus = "loading" | "ready" | "error";

export type SaveNotificationSettingResult =
  { ok: true } | { ok: false; message: string };

type Scope = "channel" | "server";

const SCOPES = {
  channel: {
    apply: applyChannelNotificationSetting,
    read: (
      settings: NotificationSettings,
      id: string,
    ): NotificationSettingState => ({
      muted: isChannelMuted(settings, id),
      level: channelNotificationLevel(settings, id),
    }),
    request: updateChannelNotificationSettingsRequest,
  },
  server: {
    apply: applyServerNotificationSetting,
    read: (
      settings: NotificationSettings,
      id: string,
    ): NotificationSettingState => ({
      muted: isServerMuted(settings, id),
      level: serverNotificationLevel(settings, id),
    }),
    request: updateServerNotificationSettingsRequest,
  },
} as const;

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(
    NO_NOTIFICATION_SETTINGS,
  );
  const [status, setStatus] = useState<NotificationSettingsStatus>("loading");
  const current = useRef(settings);

  const commit = useCallback((next: NotificationSettings) => {
    current.current = next;
    setSettings(next);
  }, []);

  const reload = useCallback(() => {
    setStatus("loading");
    return listNotificationSettingsRequest().then((result) => {
      if (result.ok) {
        commit(parseNotificationSettings(result));
        setStatus("ready");
      } else {
        setStatus("error");
      }
    });
  }, [commit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (
      scope: Scope,
      id: string,
      patch: NotificationSettingsPatch,
    ): Promise<SaveNotificationSettingResult> => {
      const { apply, read, request } = SCOPES[scope];
      const before = read(current.current, id);
      commit(apply(current.current, id, patch));

      const result: UpdateNotificationSettingsResult = await request(id, patch);
      if (result.ok) {
        commit(
          apply(current.current, id, {
            muted: result.muted,
            level: result.level,
          }),
        );
        return { ok: true };
      }

      commit(apply(current.current, id, before));
      return { ok: false, message: result.message };
    },
    [commit],
  );

  const setChannel = useCallback(
    (channelId: string, patch: NotificationSettingsPatch) =>
      save("channel", channelId, patch),
    [save],
  );

  const setServer = useCallback(
    (serverId: string, patch: NotificationSettingsPatch) =>
      save("server", serverId, patch),
    [save],
  );

  return { settings, status, reload, setChannel, setServer };
}
