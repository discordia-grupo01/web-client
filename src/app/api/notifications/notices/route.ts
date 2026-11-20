import {
  type ListStaffNoticesResult,
  STAFF_NOTICES_LOAD_FAILED,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listStaffNotices } from "@/services/notifications/service";

export async function GET(): Promise<NextResponse<ListStaffNoticesResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listStaffNotices(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: STAFF_NOTICES_LOAD_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, notices: result.data.items });
}
