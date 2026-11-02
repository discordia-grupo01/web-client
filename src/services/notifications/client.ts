import {
  type ListNotificationHistoryResult,
  NOTIFICATIONS_LOAD_FAILED,
  type NotificationHistoryQuery,
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
