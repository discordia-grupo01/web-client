import {
  type LeaveVoiceResult,
  VOICE_LEAVE_FAILED,
  voiceErrorMessage,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { leaveVoiceSession } from "@/services/voice/service";

/** BFF de `DELETE /api/voice/session`. Body JSON: `{ channelId }`. */
export async function DELETE(
  request: Request,
): Promise<NextResponse<LeaveVoiceResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const channelId = typeof body?.channelId === "string" ? body.channelId : "";

  const result = await leaveVoiceSession(session.token, channelId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: voiceErrorMessage(result.code, VOICE_LEAVE_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true });
}
