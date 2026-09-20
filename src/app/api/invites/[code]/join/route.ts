import {
  INVITE_REASONS,
  messageFor,
  reasonOf,
  UNEXPECTED_ERROR_MESSAGE,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { joinServerByCode } from "@/services/invites/service";
import type { JoinServerActionResult } from "@/types/invite.types";
import { getServer } from "@/services/servers/service";

export async function POST(
  _request: Request,
  { params }: { params: { code: string } },
): Promise<NextResponse<JoinServerActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const joinResult = await joinServerByCode(session.token, params.code);

  if (!joinResult.ok) {
    const reason = reasonOf(joinResult.details);
    const friendly = reason ? INVITE_REASONS[reason] : undefined;

    if (friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { code: friendly } },
        { status: joinResult.status || 404 },
      );
    }
    if (joinResult.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: UNEXPECTED_ERROR_MESSAGE },
      {
        status:
          joinResult.status >= 400 && joinResult.status < 500
            ? joinResult.status
            : 502,
      },
    );
  }

  const serverResult = await getServer(
    session.token,
    joinResult.data.server_id,
  );
  if (!serverResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Te uniste, pero no pudimos cargar el servidor. Recarga la pagina.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      server: serverResult.data,
      alreadyMember: joinResult.data.already_member,
    },
    { status: 200 },
  );
}
