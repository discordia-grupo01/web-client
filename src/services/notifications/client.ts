import {
  type ListNotificationHistoryResult,
  type ListNotificationSettingsResult,
  NOTIFICATION_SETTINGS_LOAD_FAILED,
  NOTIFICATION_SETTINGS_SAVE_FAILED,
  NOTIFICATIONS_LOAD_FAILED,
  type NotificationHistoryQuery,
  type NotificationSettingsPatch,
  type UpdateNotificationSettingsResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

export async function listNotificationHistoryRequest({
  limit,
  before,
}: NotificationHistoryQuery = {}): Promise<ListNotificationHistoryResult> {
  try {
    const { data } = await api.get<ListNotificationHistoryResult>(
      "/notifications/history",
      { params: { limit, before: before ?? undefined } },
    );
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: NOTIFICATIONS_LOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: NOTIFICATIONS_LOAD_FAILED };
  }
}

export async function listNotificationSettingsRequest(): Promise<ListNotificationSettingsResult> {
  try {
    const { data } = await api.get<ListNotificationSettingsResult>(
      "/notifications/settings",
    );
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: NOTIFICATION_SETTINGS_LOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: NOTIFICATION_SETTINGS_LOAD_FAILED };
  }
}

async function updateNotificationSettingsRequest(
  path: string,
  patch: NotificationSettingsPatch,
): Promise<UpdateNotificationSettingsResult> {
  try {
    const { data } = await api.put<UpdateNotificationSettingsResult>(
      path,
      patch,
    );
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: NOTIFICATION_SETTINGS_SAVE_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: NOTIFICATION_SETTINGS_SAVE_FAILED };
  }
}

export function updateChannelNotificationSettingsRequest(
  channelId: string,
  patch: NotificationSettingsPatch,
): Promise<UpdateNotificationSettingsResult> {
  return updateNotificationSettingsRequest(
    `/notifications/settings/channels/${encodeURIComponent(channelId)}`,
    patch,
  );
}

export function updateServerNotificationSettingsRequest(
  serverId: string,
  patch: NotificationSettingsPatch,
): Promise<UpdateNotificationSettingsResult> {
  return updateNotificationSettingsRequest(
    `/notifications/settings/servers/${encodeURIComponent(serverId)}`,
    patch,
  );
}
