import {
  BOOSTS_LOAD_ERROR,
  toServerBoostSummary,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import type { ServerBoostSummaryResult } from "@/services/servers/client";
import { getServerBoostSummary } from "@/services/servers/service";

function failureStatus(status: number): number {
  return status >= 400 && status < 500 ? status : 502;
}

/** BFF de `GET /v1/servers/:serverId/boosts`. */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ServerBoostSummaryResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await getServerBoostSummary(session.token, params.serverId);
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: BOOSTS_LOAD_ERROR },
      { status: failureStatus(result.status) },
    );
  }
  return NextResponse.json({
    ok: true,
    summary: toServerBoostSummary(result.data),
  });
}
