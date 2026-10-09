import {
  type ListMentionsResult,
  MENTIONS_LOAD_FAILED,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listUnreadMentions } from "@/services/mentions/service";

/** BFF de `GET /v1/mentions`: mis menciones sin leer. */
export async function GET(): Promise<NextResponse<ListMentionsResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listUnreadMentions(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: MENTIONS_LOAD_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, mentions: result.data.mentions });
}
