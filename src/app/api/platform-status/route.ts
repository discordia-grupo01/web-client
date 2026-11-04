import {
  PLATFORM_STATUS_LOAD_FAILED,
  type PlatformStatusResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getPlatformStatus } from "@/services/platform-status/service";

export async function GET(): Promise<NextResponse<PlatformStatusResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getPlatformStatus(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: PLATFORM_STATUS_LOAD_FAILED },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.data.status,
    incidents: result.data.incidents,
  });
}
