import {
  blockErrorFor,
  BLOCKS_LOAD_FAILED,
  type BlockUserResult,
  type ListBlocksResult,
  USER_BLOCK_FAILED,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { blockUser, listBlocks } from "@/services/blocks/service";

function statusOf(status: number): number {
  return status >= 400 && status < 500 ? status : 502;
}

/** BFF de `GET /v1/blocks`: a quien bloqueaste vos. */
export async function GET(): Promise<NextResponse<ListBlocksResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listBlocks(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: BLOCKS_LOAD_FAILED },
      { status: statusOf(result.status) },
    );
  }

  return NextResponse.json({
    ok: true,
    blockedUserIds: result.data.blocks.map((block) => block.user_id),
  });
}

/** BFF de `POST /v1/blocks`. Body JSON: `{ userId }`. */
export async function POST(
  request: Request,
): Promise<NextResponse<BlockUserResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";

  const result = await blockUser(session.token, userId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: blockErrorFor(result.code, USER_BLOCK_FAILED) },
      { status: statusOf(result.status) },
    );
  }

  return NextResponse.json({ ok: true });
}
