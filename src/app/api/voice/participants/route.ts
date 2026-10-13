import {
  presenceByChannel,
  VOICE_PARTICIPANTS_FAILED,
  voiceErrorMessage,
  type VoiceParticipantsResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listVoiceParticipants } from "@/services/voice/service";

/**
 * BFF de `GET /api/voice/participants?server_id=`. Query: `?serverId=`.
 * Devuelve quien esta en cada canal de voz del servidor, sin estar conectado.
 */
export async function GET(
  request: Request,
): Promise<NextResponse<VoiceParticipantsResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const serverId = new URL(request.url).searchParams.get("serverId") ?? "";

  const result = await listVoiceParticipants(session.token, serverId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: voiceErrorMessage(result.code, VOICE_PARTICIPANTS_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, byChannel: presenceByChannel(result.data) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
