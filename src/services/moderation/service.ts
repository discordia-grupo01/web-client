import "server-only";

import type { ModerationAuditPage } from "@discordia/client-shared";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

export function kickMember(
  token: string,
  serverId: string,
  userId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/kicks`, {
    method: "POST",
    token,
    data: { user_id: userId },
  });
}

/** `untilAt` es ISO; `reason` es opcional (max 512 runas). */
export function muteMember(
  token: string,
  serverId: string,
  input: { userId: string; untilAt: string; reason: string | null },
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/mutes`, {
    method: "POST",
    token,
    data: {
      user_id: input.userId,
      until_at: input.untilAt,
      reason: input.reason,
    },
  });
}

/** Levanta el silencio antes de que venza (CA3 de #60). */
export function unmuteMember(
  token: string,
  serverId: string,
  userId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/mutes/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function listModerationAudit(
  token: string,
  serverId: string,
  query: { limit: number; offset: number },
): Promise<ApiResult<ModerationAuditPage>> {
  return apiRequest<ModerationAuditPage>(
    `/v1/servers/${serverId}/moderation-audit?limit=${query.limit}&offset=${query.offset}`,
    { method: "GET", token },
  );
}
