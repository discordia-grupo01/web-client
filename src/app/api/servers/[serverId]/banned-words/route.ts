import {
  type ListBannedWordsResult,
  listBannedWordsFailureMessage,
  type SaveBannedWordsResult,
  saveBannedWordsFailureMessage,
  WORD_FILTER_REASONS,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import {
  listBannedWords,
  saveBannedWords,
} from "@/services/word-filter/service";

function failureStatus(status: number): number {
  return status >= 400 && status < 500 ? status : 502;
}

/** BFF de `GET /v1/servers/:id/banned-words`. */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ListBannedWordsResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await listBannedWords(session.token, params.serverId);
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: listBannedWordsFailureMessage(result) },
      { status: failureStatus(result.status) },
    );
  }
  return NextResponse.json({ ok: true, words: result.data.words });
}

/** BFF de `PUT /v1/servers/:id/banned-words`. Body JSON: `{ words: string[] }`. */
export async function PUT(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<SaveBannedWordsResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  let words: string[] | null = null;
  try {
    const body = await request.json();
    if (
      Array.isArray(body?.words) &&
      body.words.every((word: unknown) => typeof word === "string")
    ) {
      words = body.words;
    }
  } catch {
    // Body invalido: se responde abajo.
  }
  if (!words) {
    return NextResponse.json(
      { ok: false, message: WORD_FILTER_REASONS.word_empty },
      { status: 400 },
    );
  }

  const result = await saveBannedWords(session.token, params.serverId, words);
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: saveBannedWordsFailureMessage(result) },
      { status: failureStatus(result.status) },
    );
  }
  return NextResponse.json({ ok: true, words: result.data.words });
}
