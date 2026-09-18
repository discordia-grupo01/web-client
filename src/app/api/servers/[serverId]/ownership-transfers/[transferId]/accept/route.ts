import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { acceptOwnershipTransfer } from "@/services/ownership-transfers/service";
import type { RespondTransferActionResult } from "@/types/ownership-transfer.types";

const REASON_MESSAGES: Record<string, string> = {
  transfer_not_pending: "Esta transferencia ya no está pendiente.",
};

/**
 * BFF de `POST /v1/servers/:id/ownership-transfers/:transferId/accept`.
 * CA1: solo el destinatario (`to_user_id`) puede aceptar -- al hacerlo pasa a
 * ser el nuevo owner del servidor.
 */
export async function POST(
  _request: Request,
  { params }: { params: { serverId: string; transferId: string } },
): Promise<NextResponse<RespondTransferActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await acceptOwnershipTransfer(
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
          message: "Solo la persona invitada puede aceptar esta transferencia.",
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

    const reason =
      typeof result.details?.reason === "string"
        ? result.details.reason
        : undefined;
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
