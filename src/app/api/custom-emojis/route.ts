import {
  CUSTOM_EMOJIS_LOAD_FAILED,
  MAX_CUSTOM_EMOJI_IDS,
  messageFor,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listCustomEmojis } from "@/services/custom-emojis/service";
import type { ListCustomEmojisResult } from "@/services/custom-emojis/types";

/**
 * BFF de `GET /v1/custom-emojis?ids=a,b,c`: nombre e imagen de los emojis que
 * aparecen escritos en mensajes y reacciones.
 */
export async function GET(
  request: Request,
): Promise<NextResponse<ListCustomEmojisResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => id !== "")
    .slice(0, MAX_CUSTOM_EMOJI_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, emojis: [] });
  }

  const result = await listCustomEmojis(session.token, ids);
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: messageFor(result, {}, CUSTOM_EMOJIS_LOAD_FAILED) },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, emojis: result.data.emojis });
}
