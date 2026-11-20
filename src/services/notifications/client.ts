import {
  type ListNotificationHistoryResult,
  type ListStaffNoticesResult,
  type MarkStaffNoticeSeenResult,
  STAFF_NOTICE_SEEN_FAILED,
  STAFF_NOTICES_LOAD_FAILED,
  type MarkTransfersReadResult,
  NOTIFICATIONS_MARK_ALL_READ_FAILED,
  type ListNotificationSettingsResult,
  NOTIFICATION_SETTINGS_LOAD_FAILED,
  NOTIFICATION_SETTINGS_SAVE_FAILED,
  NOTIFICATIONS_LOAD_FAILED,
  type NotificationHistoryQuery,
  type NotificationSettingsPatch,
  type SocketTicketResult,
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

export async function markTransfersReadRequest(
  transferIds: readonly string[],
): Promise<MarkTransfersReadResult> {
  try {
    const { data } = await api.post<MarkTransfersReadResult>(
      "/notifications/history/transfers/read",
      { transfer_ids: transferIds },
    );
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: NOTIFICATIONS_MARK_ALL_READ_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: NOTIFICATIONS_MARK_ALL_READ_FAILED };
  }
}

export async function listStaffNoticesRequest(): Promise<ListStaffNoticesResult> {
  try {
    const { data } = await api.get<ListStaffNoticesResult>(
      "/notifications/notices",
    );
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: STAFF_NOTICES_LOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: STAFF_NOTICES_LOAD_FAILED };
  }
}

export async function markStaffNoticeSeenRequest(
  noticeId: string,
): Promise<MarkStaffNoticeSeenResult> {
  try {
    const { data } = await api.post<MarkStaffNoticeSeenResult>(
      `/notifications/notices/${encodeURIComponent(noticeId)}/seen`,
    );
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: STAFF_NOTICE_SEEN_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: STAFF_NOTICE_SEEN_FAILED };
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

export async function fetchUnreadSocketTicketRequest(): Promise<SocketTicketResult> {
  try {
    const { data, status } = await api.post<{ ticket?: string }>(
      "/notifications/socket-tickets",
    );
    if (status === 200 && typeof data?.ticket === "string") {
      return { ok: true, ticket: data.ticket };
    }
    return { ok: false, sessionExpired: status === 401 };
  } catch {
    return { ok: false, sessionExpired: false };
  }
}
