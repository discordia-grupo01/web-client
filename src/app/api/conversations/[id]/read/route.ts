import {
  DM_MARK_READ_FAILED,
  type MessageActionResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { markConversationRead } from "@/services/conversations/service";

/** BFF de `POST /v1/conversations/:id/read`. Sin body. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<MessageActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await markConversationRead(session.token, params.id);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: DM_MARK_READ_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true });
}
