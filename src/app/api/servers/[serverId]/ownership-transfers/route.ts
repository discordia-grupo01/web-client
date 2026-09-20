import {
  fieldOf,
  messageFor,
  reasonOf,
  TRANSFER_REASONS,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import {
  getPendingOwnershipTransfer,
  initiateOwnershipTransfer,
} from "@/services/ownership-transfers/service";
import type {
  GetPendingTransferActionResult,
  InitiateTransferActionResult,
} from "@/types/ownership-transfer.types";

/**
 * BFF de `GET /v1/servers/:id/ownership-transfers/pending`. Un servidor sin
 * transferencia pendiente devuelve 404 del lado del back -- acá se normaliza
 * a `{ ok: true, transfer: null }`, no es un error.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<GetPendingTransferActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getPendingOwnershipTransfer(
    session.token,
    params.serverId,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 404) {
      return NextResponse.json({ ok: true, transfer: null }, { status: 200 });
    }
    return NextResponse.json(
      {
        ok: false,
        message:
          "No pudimos cargar la transferencia de propiedad. Intenta de nuevo.",
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, transfer: result.data },
    { status: 200 },
  );
}

/**
 * BFF de `POST /v1/servers/:id/ownership-transfers`. Body JSON: `{
 * to_user_id }`. Solo el owner puede llamar esto (CA2/CA1 de la HU); el
 * destinatario tiene que ser miembro del servidor.
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<InitiateTransferActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let toUserId = "";
  try {
    const body = await request.json();
    if (typeof body?.to_user_id === "string") toUserId = body.to_user_id.trim();
  } catch {
    // Sin body: el back lo va a rechazar como "required".
  }

  const result = await initiateOwnershipTransfer(
    session.token,
    params.serverId,
    toUserId,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: "Solo el propietario puede transferir el servidor.",
        },
        { status: 403 },
      );
    }

    const field = fieldOf(result.details);
    const reason = reasonOf(result.details);
    const friendly = reason ? TRANSFER_REASONS[reason] : undefined;

    if (field === "to_user_id" && friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { to_user_id: friendly } },
        { status: result.status || 400 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: messageFor(
          result,
          TRANSFER_REASONS,
          "Algo salió mal. Intenta de nuevo.",
        ),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, transfer: result.data },
    { status: 201 },
  );
}
