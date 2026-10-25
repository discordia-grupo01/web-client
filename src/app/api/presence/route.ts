import {
  type ListPresenceResult,
  PRESENCE_LOAD_FAILED,
  PRESENCE_MAX_IDS_PER_REQUEST,
} from "@discordia/client-shared";
import { type NextRequest, NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getPresence } from "@/services/presence/service";

/** BFF de `GET /v1/presence`: el estado de actividad de hasta 100 usuarios. */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ListPresenceResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const userIds = (request.nextUrl.searchParams.get("user_ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (userIds.length === 0 || userIds.length > PRESENCE_MAX_IDS_PER_REQUEST) {
    return NextResponse.json(
      { ok: false, message: PRESENCE_LOAD_FAILED },
      { status: 400 },
    );
  }

  const result = await getPresence(session.token, userIds);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: PRESENCE_LOAD_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, presences: result.data.presences });
}
