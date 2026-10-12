import {
  MEMBER_PERMISSIONS_LOAD_FAILED,
  type MemberPermissionsResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getMemberChannelPermissions } from "@/services/channel-permissions/service";

/**
 * BFF de `GET /v1/channels/:id/members/:userId/permissions` para el usuario de
 * la sesion: lo que puede hacer en ese canal, con las excepciones aplicadas.
 * El usuario sale de la cookie, asi el navegador no puede pedir los de otro.
 */
export async function GET(
  _request: Request,
  { params }: { params: { channelId: string } },
): Promise<NextResponse<MemberPermissionsResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getMemberChannelPermissions(
    session.token,
    params.channelId,
    session.user.id,
  );
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: MEMBER_PERMISSIONS_LOAD_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, permissions: result.data.permissions },
    { status: 200 },
  );
}
