import {
  MENTIONS_MARK_READ_FAILED,
  type MessageActionResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { markChannelMentionsRead } from "@/services/mentions/service";

/** BFF de `POST /v1/channels/:id/mentions/read`. Sin body. */
export async function POST(
  _request: Request,
  { params }: { params: { channelId: string } },
): Promise<NextResponse<MessageActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await markChannelMentionsRead(session.token, params.channelId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: MENTIONS_MARK_READ_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true });
}
