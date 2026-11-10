import "server-only";

import {
  type ClosedReportStatus,
  createReportBody,
  type CreateReportInput,
  isModerator,
  PENDING_REPORTS_COUNT_QUERY,
  pendingReportsTotalFrom,
  type Report,
  type ReportListResponse,
  type ReportResolutionAction,
  type ReportStatus,
  reportsQuery,
} from "@discordia/client-shared";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Reportes de mensajes y usuarios, contra `servers` (via Kong):
 *   POST  /v1/servers/:id/reports            -> 201 | 400 | 401 | 403 | 404 | 409
 *   GET   /v1/servers/:id/reports?status=    -> 200 | 400 | 401 | 403 | 404
 *   PATCH /v1/servers/:id/reports/:reportId  -> 200 | 400 | 401 | 403 | 404 | 409
 *
 * Reporta cualquier miembro; listar y cerrar exige ser moderador
 * (`MANAGE_MESSAGES` + `KICK_MEMBERS` + `BAN_MEMBERS`).
 */
export function createReport(
  token: string,
  serverId: string,
  input: CreateReportInput,
): Promise<ApiResult<Report>> {
  return apiRequest<Report>(`/v1/servers/${serverId}/reports`, {
    method: "POST",
    token,
    data: createReportBody(input),
  });
}

export function listReports(
  token: string,
  serverId: string,
  query: { status: ReportStatus; limit: number; offset: number },
): Promise<ApiResult<ReportListResponse>> {
  return apiRequest<ReportListResponse>(
    `/v1/servers/${serverId}/reports?${reportsQuery(query)}`,
    { method: "GET", token },
  );
}

export function closeReport(
  token: string,
  serverId: string,
  reportId: string,
  status: ClosedReportStatus,
  action: ReportResolutionAction | null = null,
): Promise<ApiResult<Report>> {
  return apiRequest<Report>(`/v1/servers/${serverId}/reports/${reportId}`, {
    method: "PATCH",
    token,
    data: action ? { status, action } : { status },
  });
}

/**
 * Total de reportes pendientes para el indicador del riel. Primero mira los
 * permisos efectivos (que nunca dan 403 a un miembro) y solo si es moderador
 * pide la lista: asi el `GET /reports` no responde 403 a quien no lo es.
 * `null` es "no se pudo saber"; quien no es moderador recibe 0.
 */
export async function countPendingReports(
  token: string,
  serverId: string,
  userId: string,
): Promise<number | null> {
  const permissions = await apiRequest<{ permissions: string[] }>(
    `/v1/servers/${serverId}/members/${userId}/permissions`,
    { method: "GET", token },
  );
  if (!permissions.ok) return permissions.status === 403 ? 0 : null;
  if (!isModerator(permissions.data.permissions)) return 0;

  const reports = await apiRequest<ReportListResponse>(
    `/v1/servers/${serverId}/reports?${PENDING_REPORTS_COUNT_QUERY}`,
    { method: "GET", token },
  );
  return pendingReportsTotalFrom(reports);
}
