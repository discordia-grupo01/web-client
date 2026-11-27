import {
  messageFor,
  type RespondTransferResult,
  TRANSFER_NOT_FOUND,
  TRANSFER_ONLY_TARGET_ACCEPTS,
  TRANSFER_REASONS,
  UNEXPECTED_ERROR_MESSAGE,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { acceptOwnershipTransfer } from "@/services/ownership-transfers/service";

export async function POST(
  _request: Request,
  { params }: { params: { serverId: string; transferId: string } },
): Promise<NextResponse<RespondTransferResult>> {
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
          message: TRANSFER_ONLY_TARGET_ACCEPTS,
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
