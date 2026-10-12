import {
  type MuteMemberResult,
  muteFailureMessage,
  validateBanReason,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { muteMember } from "@/services/moderation/service";

/**
 * BFF de `POST /v1/servers/:id/mutes`. Body JSON: `{ user_id, until_at,
 * reason? }`. El back valida permiso, jerarquia y que `until_at` sea futuro.
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<MuteMemberResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  let userId = "";
  let untilAt = "";
  let reason = "";
  try {
    const body = await request.json();
    if (typeof body?.user_id === "string") userId = body.user_id.trim();
    if (typeof body?.until_at === "string") untilAt = body.until_at;
    if (typeof body?.reason === "string") reason = body.reason.trim();
  } catch {
    // Sin body: el back lo rechaza.
  }

  const reasonError = validateBanReason(reason);
  if (reasonError) {
    return NextResponse.json(
      { ok: false, message: reasonError },
      { status: 400 },
    );
  }

  const result = await muteMember(session.token, params.serverId, {
    userId,
    untilAt,
    reason: reason || null,
  });
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: muteFailureMessage(result) },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }
  return NextResponse.json({ ok: true });
}
