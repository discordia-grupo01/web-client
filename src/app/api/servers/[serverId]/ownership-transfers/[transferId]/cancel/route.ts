import {
  messageFor,
  reasonOf,
  TRANSFER_NOT_FOUND,
  TRANSFER_ONLY_SENDER_CANCELS,
  TRANSFER_REASONS,
  UNEXPECTED_ERROR_MESSAGE,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { cancelOwnershipTransfer } from "@/services/ownership-transfers/service";
import type { RespondTransferActionResult } from "@/types/ownership-transfer.types";

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
          message: TRANSFER_ONLY_SENDER_CANCELS,
        },
        { status: 403 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: TRANSFER_NOT_FOUND },
        { status: 404 },
      );
    }

    const reason = reasonOf(result.details);
    const friendly = reason ? TRANSFER_REASONS[reason] : undefined;
    return NextResponse.json(
      {
        ok: false,
        message: messageFor(result, TRANSFER_REASONS, UNEXPECTED_ERROR_MESSAGE),
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
