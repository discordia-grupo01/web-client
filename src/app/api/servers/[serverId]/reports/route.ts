import {
  createReportFailureMessage,
  type CreateReportInput,
  type CreateReportResult,
  type ListReportsResult,
  listReportsFailureMessage,
  REPORT_REASONS,
  REPORTS_PAGE_SIZE,
  type ReportStatus,
} from "@discordia/client-shared";
import { NextResponse, type NextRequest } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { createReport, listReports } from "@/services/reports/service";

const STATUSES: readonly ReportStatus[] = ["pending", "resolved", "dismissed"];

function failureStatus(status: number): number {
  return status >= 400 && status < 500 ? status : 502;
}

function parseCreateInput(body: unknown): CreateReportInput | null {
  if (typeof body !== "object" || body === null) return null;
  const input = body as Record<string, unknown>;
  const reason = typeof input.reason === "string" ? input.reason : "";
  if (
    input.kind === "message" &&
    typeof input.channelId === "string" &&
    typeof input.messageId === "string"
  ) {
    return {
      kind: "message",
      channelId: input.channelId,
      messageId: input.messageId,
      reason,
    };
  }
  if (input.kind === "user" && typeof input.userId === "string") {
    return { kind: "user", userId: input.userId, reason };
  }
  return null;
}

/** BFF de `POST /v1/servers/:id/reports`. Body: `CreateReportInput`. */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<CreateReportResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  let input: CreateReportInput | null = null;
  try {
    input = parseCreateInput(await request.json());
  } catch {
    // Body invalido: se responde abajo.
  }
  if (!input) {
    return NextResponse.json(
      { ok: false, message: REPORT_REASONS.required },
      { status: 400 },
    );
  }

  const result = await createReport(session.token, params.serverId, input);
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: createReportFailureMessage(result) },
      { status: failureStatus(result.status) },
    );
  }
  return NextResponse.json({ ok: true, report: result.data }, { status: 201 });
}

/** BFF de `GET /v1/servers/:id/reports?status=&limit=&offset=`. */
export async function GET(
  request: NextRequest,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ListReportsResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const search = request.nextUrl.searchParams;
  const rawStatus = search.get("status");
  const status = STATUSES.find((value) => value === rawStatus) ?? "pending";
  const limit = Number(search.get("limit")) || REPORTS_PAGE_SIZE;
  const offset = Math.max(Number(search.get("offset")) || 0, 0);

  const result = await listReports(session.token, params.serverId, {
    status,
    limit,
    offset,
  });
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: listReportsFailureMessage(result) },
      { status: failureStatus(result.status) },
    );
  }
  return NextResponse.json({
    ok: true,
    reports: result.data.reports,
    total: result.data.total,
  });
}
