import { deleteEmojiFailureMessage } from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { deleteServerEmoji } from "@/services/emojis/service";
import type { DeleteServerEmojiResult } from "@/services/emojis/types";

/**
 * BFF de `DELETE /v1/servers/:id/emojis/:emojiId`. Exige `MANAGE_SERVER`. El
 * borrado es logico: libera el lugar y el nombre, y los mensajes que ya lo
 * usaron lo siguen mostrando.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { serverId: string; emojiId: string } },
): Promise<NextResponse<DeleteServerEmojiResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await deleteServerEmoji(
    session.token,
    params.serverId,
    params.emojiId,
  );

  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: deleteEmojiFailureMessage(result) },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
