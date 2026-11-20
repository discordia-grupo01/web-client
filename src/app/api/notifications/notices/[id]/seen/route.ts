import {
  type MarkStaffNoticeSeenResult,
  STAFF_NOTICE_SEEN_FAILED,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { markStaffNoticeSeen } from "@/services/notifications/service";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<MarkStaffNoticeSeenResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await markStaffNoticeSeen(session.token, params.id);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: STAFF_NOTICE_SEEN_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true });
}
