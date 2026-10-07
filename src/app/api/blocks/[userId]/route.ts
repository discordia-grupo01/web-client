import {
  blockErrorFor,
  type BlockUserResult,
  USER_UNBLOCK_FAILED,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { unblockUser } from "@/services/blocks/service";

/** BFF de `DELETE /v1/blocks/:user_id`. Sin body. */
export async function DELETE(
  _request: Request,
  { params }: { params: { userId: string } },
): Promise<NextResponse<BlockUserResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await unblockUser(session.token, params.userId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: blockErrorFor(result.code, USER_UNBLOCK_FAILED) },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true });
}
