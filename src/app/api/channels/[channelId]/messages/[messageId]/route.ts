import {
  MESSAGE_DELETE_FAILED,
  messageErrorFor,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { deleteMessage } from "@/services/messages/service";

/** BFF de `DELETE /v1/channels/:id/messages/:messageId`. */
export async function DELETE(
  _request: Request,
  { params }: { params: { channelId: string; messageId: string } },
): Promise<NextResponse<{ ok: true } | { ok: false; message: string }>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await deleteMessage(
    session.token,
    params.channelId,
    params.messageId,
  );
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      {
        ok: false,
        message: messageErrorFor(result.code, MESSAGE_DELETE_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }
  return NextResponse.json({ ok: true });
}
