import {
  type ListNotificationHistoryResult,
  NOTIFICATIONS_LOAD_FAILED,
} from "@discordia/client-shared";

import { NextResponse, type NextRequest } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listNotificationHistory } from "@/services/notifications/service";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ListNotificationHistoryResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { searchParams } = request.nextUrl;
  const limit = searchParams.get("limit");

  const result = await listNotificationHistory(session.token, {
    limit: limit === null ? undefined : Number(limit),
    before: searchParams.get("before"),
  });
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: NOTIFICATIONS_LOAD_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    items: result.data.items,
    nextCursor: result.data.next_cursor,
  });
}
