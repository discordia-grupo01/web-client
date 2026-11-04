import {
  parsePrivateCall,
  PRIVATE_CALL_START_FAILED,
  type StartPrivateCallResult,
  voiceErrorMessage,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { startPrivateCall } from "@/services/voice/service";

/**
 * BFF de `POST /api/voice/calls`. Body JSON: `{ recipientId, conversationId }`.
 * Hace sonar la llamada en las sesiones de `recipientId`.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<StartPrivateCallResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const recipientId =
    typeof body?.recipientId === "string" ? body.recipientId : "";
  const conversationId =
    typeof body?.conversationId === "string" ? body.conversationId : "";

  const result = await startPrivateCall(
    session.token,
    recipientId,
    conversationId,
  );
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: voiceErrorMessage(result.code, PRIVATE_CALL_START_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  const call = parsePrivateCall(result.data);
  if (!call) {
    return NextResponse.json(
      { ok: false, message: PRIVATE_CALL_START_FAILED },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, call }, { status: 201 });
}
