import { reasonOf } from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { cancelOwnershipTransfer } from "@/services/ownership-transfers/service";
import type { RespondTransferActionResult } from "@/types/ownership-transfer.types";

const REASON_MESSAGES: Record<string, string> = {
  transfer_not_pending: "Esta transferencia ya no está pendiente.",
};

/**
 * BFF de `POST /v1/servers/:id/ownership-transfers/:transferId/cancel`. Solo
 * quien inició la transferencia (`from_user_id`, el owner) puede cancelarla
 * antes de que el destinatario responda.
 */
export async function POST(
  _request: Request,
  { params }: { params: { serverId: string; transferId: string } },
): Promise<NextResponse<RespondTransferActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await cancelOwnershipTransfer(
    session.token,
    params.serverId,
    params.transferId,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: "Solo quien inició la transferencia puede cancelarla.",
        },
        { status: 403 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: "Esta transferencia ya no existe." },
        { status: 404 },
      );
    }

    const reason = reasonOf(result.details);
    const friendly = reason ? REASON_MESSAGES[reason] : undefined;
    return NextResponse.json(
      { ok: false, message: friendly ?? "Algo salió mal. Intenta de nuevo." },
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
