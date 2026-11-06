import "server-only";

import type {
  NotificationHistoryQuery,
  NotificationHistoryResponse,
  NotificationSettingsPatch,
  NotificationSettingsResponse,
  NotificationSettingState,
} from "@discordia/client-shared";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

export function listNotificationHistory(
  token: string,
  { limit, before }: NotificationHistoryQuery = {},
): Promise<ApiResult<NotificationHistoryResponse>> {
  const query = new URLSearchParams();
  if (limit !== undefined) query.set("limit", String(limit));
  if (before) query.set("before", before);
  const suffix = query.toString();

  return apiRequest<NotificationHistoryResponse>(
    `/v1/notifications/history${suffix ? `?${suffix}` : ""}`,
    { token },
  );
}

export function getNotificationSettings(
  token: string,
): Promise<ApiResult<NotificationSettingsResponse>> {
  return apiRequest<NotificationSettingsResponse>(
    "/v1/notifications/settings",
    { token },
  );
}

export function updateChannelNotificationSettings(
  token: string,
  channelId: string,
  patch: NotificationSettingsPatch,
): Promise<ApiResult<NotificationSettingState>> {
  return apiRequest<NotificationSettingState>(
    `/v1/notifications/settings/channels/${encodeURIComponent(channelId)}`,
    { method: "PUT", token, data: patch },
  );
}

export function updateServerNotificationSettings(
  token: string,
  serverId: string,
  patch: NotificationSettingsPatch,
): Promise<ApiResult<NotificationSettingState>> {
  return apiRequest<NotificationSettingState>(
    `/v1/notifications/settings/servers/${encodeURIComponent(serverId)}`,
    { method: "PUT", token, data: patch },
  );
}

export function createUnreadSocketTicket(
  token: string,
): Promise<ApiResult<{ ticket: string; expires_in: number }>> {
  return apiRequest<{ ticket: string; expires_in: number }>(
    "/v1/notifications/socket-tickets",
    { method: "POST", token },
  );
}
