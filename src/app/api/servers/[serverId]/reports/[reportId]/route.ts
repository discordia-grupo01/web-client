import {
  type ClosedReportStatus,
  closeReportFailureMessage,
  type CloseReportResult,
  isReportGone,
  REPORT_REASONS,
  type ReportResolutionAction,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { closeReport } from "@/services/reports/service";

const ACTIONS: readonly ReportResolutionAction[] = [
  "delete_message",
  "mute",
  "kick",
  "ban",
];

/**
 * BFF de `PATCH /v1/servers/:id/reports/:reportId`.
 * Body: `{ status, action? }`; `action` solo al resolver desde una sancion.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { serverId: string; reportId: string } },
): Promise<NextResponse<CloseReportResult | { ok: false; message: string }>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  let status: ClosedReportStatus | null = null;
  let action: ReportResolutionAction | null = null;
  try {
    const body = await request.json();
    if (body?.status === "resolved" || body?.status === "dismissed") {
      status = body.status;
    }
    action = ACTIONS.find((value) => value === body?.action) ?? null;
  } catch {
    // Body invalido: se responde abajo.
  }
  if (!status) {
    return NextResponse.json(
      { ok: false, message: REPORT_REASONS.status_invalid, isGone: false },
      { status: 400 },
    );
  }

  const result = await closeReport(
    session.token,
    params.serverId,
    params.reportId,
    status,
    action,
  );
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      {
        ok: false,
        message: closeReportFailureMessage(result),
        isGone: isReportGone(result),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }
  return NextResponse.json({ ok: true, report: result.data });
}
