import {
  type ClosedReportStatus,
  type CloseReportResult,
  type CreateReportInput,
  type CreateReportResult,
  type ListReportsResult,
  type PendingReportsCount,
  REPORT_CLOSE_FAILED,
  REPORT_CREATE_FAILED,
  type ReportStatus,
  type ReportResolutionAction,
  REPORTS_LOAD_FAILED,
  reportsQuery,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

export async function createReportRequest(
  serverId: string,
  input: CreateReportInput,
): Promise<CreateReportResult> {
  try {
    const { data } = await api.post<CreateReportResult>(
      `/servers/${serverId}/reports`,
      input,
    );
    return data;
  } catch {
    return { ok: false, message: REPORT_CREATE_FAILED };
  }
}

export async function listReportsRequest(
  serverId: string,
  query: { status: ReportStatus; limit: number; offset: number },
): Promise<ListReportsResult> {
  try {
    const { data } = await api.get<ListReportsResult>(
      `/servers/${serverId}/reports?${reportsQuery(query)}`,
    );
    return data;
  } catch {
    return { ok: false, message: REPORTS_LOAD_FAILED };
  }
}

export async function closeReportRequest(
  serverId: string,
  reportId: string,
  status: ClosedReportStatus,
  action: ReportResolutionAction | null = null,
): Promise<CloseReportResult> {
  try {
    const { data } = await api.patch<CloseReportResult>(
      `/servers/${serverId}/reports/${reportId}`,
      action ? { status, action } : { status },
    );
    return data;
  } catch {
    return { ok: false, message: REPORT_CLOSE_FAILED, isGone: false };
  }
}

/** Nunca falla: si algo sale mal devuelve `total: null` (conservar el anterior). */
export async function pendingReportsCountRequest(
  serverId: string,
): Promise<PendingReportsCount> {
  try {
    const { data } = await api.get<PendingReportsCount>(
      `/servers/${serverId}/reports/pending-count`,
    );
    return typeof data?.total === "number" ? data : { total: null };
  } catch {
    return { total: null };
  }
}
