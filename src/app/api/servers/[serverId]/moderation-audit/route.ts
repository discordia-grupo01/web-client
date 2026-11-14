import {
  DEFAULT_PAGE_SIZE,
  type ListModerationAuditResult,
  listModerationAuditFailureMessage,
} from "@discordia/client-shared";
import { NextResponse, type NextRequest } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listModerationAudit } from "@/services/moderation/service";

function failureStatus(status: number): number {
  return status >= 400 && status < 500 ? status : 502;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ListModerationAuditResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const search = request.nextUrl.searchParams;
  const limit = Number(search.get("limit")) || DEFAULT_PAGE_SIZE;
  const offset = Math.max(Number(search.get("offset")) || 0, 0);

  const result = await listModerationAudit(session.token, params.serverId, {
    limit,
    offset,
  });
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: listModerationAuditFailureMessage(result) },
      { status: failureStatus(result.status) },
    );
  }
  return NextResponse.json({
    ok: true,
    entries: result.data.entries,
    total: result.data.total,
  });
}
