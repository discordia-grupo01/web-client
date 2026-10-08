import {
  DM_CONVERSATIONS_LOAD_FAILED,
  type ListConversationsResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listConversations } from "@/services/conversations/service";

/** BFF de `GET /v1/conversations`: mis conversaciones directas. */
export async function GET(): Promise<NextResponse<ListConversationsResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listConversations(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: DM_CONVERSATIONS_LOAD_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    conversations: result.data.conversations,
  });
}
