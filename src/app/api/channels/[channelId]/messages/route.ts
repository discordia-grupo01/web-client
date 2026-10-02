import {
  isMessageErrorCode,
  type ListMessagesResult,
  MESSAGES_LOAD_FAILED,
  messageErrorFor,
} from "@discordia/client-shared";
import { NextResponse, type NextRequest } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listMessages } from "@/services/messages/service";

/**
 * BFF de `GET /v1/channels/:id/messages` (historial). Query opcional:
 * `limit` y `before` (el `next_cursor` de la pagina anterior).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } },
): Promise<NextResponse<ListMessagesResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { searchParams } = request.nextUrl;
  const rawLimit = Number(searchParams.get("limit"));
  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : undefined;
  const before = searchParams.get("before") ?? undefined;

  const result = await listMessages(session.token, params.channelId, {
    limit,
    before,
  });

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: messageErrorFor(result.code, MESSAGES_LOAD_FAILED),
        ...(isMessageErrorCode(result.code) ? { code: result.code } : {}),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    messages: result.data.messages,
    nextCursor: result.data.next_cursor,
  });
}
