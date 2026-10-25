import {
  messageSearchErrorFor,
  type SearchMessagesResult,
} from "@discordia/client-shared";
import { NextResponse, type NextRequest } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { searchMessages } from "@/services/messages/service";

/**
 * BFF de `GET /v1/servers/:id/messages/search`. Query: `q` y/o `author_id`, y
 * `before` (el `next_cursor` de la pagina anterior).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<SearchMessagesResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { searchParams } = request.nextUrl;
  const result = await searchMessages(
    session.token,
    params.serverId,
    {
      text: searchParams.get("q") ?? "",
      authorId: searchParams.get("author_id"),
    },
    searchParams.get("before"),
  );

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: messageSearchErrorFor(result.code, result.status),
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
    total: result.data.total,
    totalCapped: result.data.total_capped ?? false,
  });
}
