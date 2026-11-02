import {
  type LookupMessagesResult,
  MESSAGES_LOAD_FAILED,
} from "@discordia/client-shared";

import { NextResponse, type NextRequest } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { lookupMessages } from "@/services/messages/service";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<LookupMessagesResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => id !== "");

  const result = await lookupMessages(session.token, ids);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: MESSAGES_LOAD_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, messages: result.data.messages });
}
