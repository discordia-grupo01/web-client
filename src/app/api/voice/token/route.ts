import {
  VOICE_CONNECT_FAILED,
  voiceErrorMessage,
  type VoiceTokenResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { requestVoiceToken } from "@/services/voice/service";

/**
 * BFF de `POST /api/voice/token`. Body JSON: `{ channelId }`. Devuelve la URL
 * y el token de LiveKit; el navegador se conecta directo a LiveKit con eso.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<VoiceTokenResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const channelId = typeof body?.channelId === "string" ? body.channelId : "";

  const result = await requestVoiceToken(session.token, channelId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: voiceErrorMessage(result.code, VOICE_CONNECT_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, token: result.data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
