import {
  EMOJI_IMAGE_REQUIRED,
  emojiUploadErrorFor,
  listEmojisFailureMessage,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listServerEmojis, uploadServerEmoji } from "@/services/emojis/service";
import type {
  ListServerEmojisResult,
  UploadServerEmojiResult,
} from "@/services/emojis/types";

function failureStatus(status: number): number {
  return status >= 400 && status < 500 ? status : 502;
}

/** BFF de `GET /v1/servers/:id/emojis`. Lo ve cualquier miembro. */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ListServerEmojisResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await listServerEmojis(session.token, params.serverId);
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: listEmojisFailureMessage(result) },
      { status: failureStatus(result.status) },
    );
  }

  return NextResponse.json({ ok: true, page: result.data });
}

/**
 * BFF de `POST /v1/servers/:id/emojis`. Recibe el multipart del navegador
 * (`name` e `image`) y lo reenvia tal cual con el JWT de la cookie httpOnly.
 *
 * El error vuelve con el campo que hay que marcar: el back dice en
 * `details.field` si el problema es el nombre o la imagen, y `emojiUploadErrorFor`
 * lo traduce. Exige `MANAGE_SERVER`.
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<UploadServerEmojiResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, field: "image", message: EMOJI_IMAGE_REQUIRED },
      { status: 400 },
    );
  }

  const result = await uploadServerEmoji(
    session.token,
    params.serverId,
    formData,
  );

  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    const { field, message } = emojiUploadErrorFor(
      result.details,
      result.status,
    );
    return NextResponse.json(
      { ok: false, field, message },
      { status: failureStatus(result.status) },
    );
  }

  return NextResponse.json({ ok: true, emoji: result.data }, { status: 201 });
}
