import { NextResponse } from "next/server";

import { getSession } from "@/features/auth/session";
import { getServer, joinServerByCode } from "@/features/servers/service";
import type { JoinServerActionResult } from "@/features/servers/types";

const SESSION_EXPIRED = "Tu sesión expiró. Volvé a iniciar sesión.";

const REASON_MESSAGES: Record<string, string> = {
  invitation_invalid: "Este enlace de invitación no es válido o expiró.",
  user_banned: "No podés unirte a este servidor.",
};

export async function POST(
  _request: Request,
  { params }: { params: { code: string } },
): Promise<NextResponse<JoinServerActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const joinResult = await joinServerByCode(session.token, params.code);

  if (!joinResult.ok) {
    const reason =
      typeof joinResult.details?.reason === "string"
        ? joinResult.details.reason
        : undefined;
    const friendly = reason ? REASON_MESSAGES[reason] : undefined;

    if (friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { code: friendly } },
        { status: joinResult.status || 404 },
      );
    }
    if (joinResult.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "Algo salio mal. Intenta de nuevo." },
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
