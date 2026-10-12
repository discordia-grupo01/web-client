import {
  type KickMemberResult,
  kickFailureMessage,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { kickMember } from "@/services/moderation/service";

/**
 * BFF de `POST /v1/servers/:id/kicks`. Body JSON: `{ user_id }`. El back
 * valida el permiso (CA3) y la jerarquia (CA2).
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<KickMemberResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  let userId = "";
  try {
    const body = await request.json();
    if (typeof body?.user_id === "string") userId = body.user_id.trim();
  } catch {
    // Sin body: el back lo rechaza como "required".
  }

  const result = await kickMember(session.token, params.serverId, userId);
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: kickFailureMessage(result) },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }
  return NextResponse.json({ ok: true });
}
