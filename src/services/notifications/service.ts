import "server-only";

import type {
  NotificationHistoryQuery,
  NotificationHistoryResponse,
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
