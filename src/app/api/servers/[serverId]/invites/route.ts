import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import {
  generateInvitation,
  listInvitations,
} from "@/services/invites/service";
import type {
  CreateInviteActionResult,
  ListInvitationsActionResult,
} from "@/types/invite.types";

const REASON_MESSAGES: Record<string, string> = {
  max_uses_invalid: "El límite de usos debe ser un número mayor a 0.",
  server_not_found: "El servidor no existe.",
  invite_permission_denied:
    "Tenés que ser miembro de este servidor para invitar gente.",
};

/**
 * BFF de `GET /v1/servers/:id/invites`. Trae todas las invitaciones del
 * server (activas, revocadas o vencidas) -- cualquier miembro puede verlas.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ListInvitationsActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listInvitations(session.token, params.serverId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos cargar las invitaciones. Intenta de nuevo.",
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, invitations: result.data },
    { status: 200 },
  );
}

/**
 * BFF de `POST /v1/servers/:id/invites`. Body JSON opcional: `{ maxUses? }`.
 * Cualquier miembro puede generar invitaciones, no solo el owner.
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<CreateInviteActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let maxUses: number | undefined;
  try {
    const body = await request.json();
    if (typeof body?.maxUses === "number") maxUses = body.maxUses;
  } catch {
    // Body vacio es valido (sin limite de usos).
  }

  const result = await generateInvitation(
    session.token,
    params.serverId,
    maxUses,
  );

  if (!result.ok) {
    const field =
      typeof result.details?.field === "string"
        ? result.details.field
        : undefined;
    const reason =
      typeof result.details?.reason === "string"
        ? result.details.reason
        : undefined;
    const friendly = reason ? REASON_MESSAGES[reason] : undefined;

    if (field === "max_uses" && friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { max_uses: friendly } },
        { status: result.status || 400 },
      );
    }
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: friendly ?? "Algo salio mal. Intenta de nuevo." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, invitation: result.data },
    { status: 201 },
  );
}
