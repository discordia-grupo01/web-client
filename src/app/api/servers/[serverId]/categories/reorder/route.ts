import {
  CATEGORY_REASONS,
  CATEGORY_REORDER_FAILED,
  messageFor,
  type ReorderCategoriesResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { reorderCategories } from "@/services/categories/service";

export async function PATCH(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ReorderCategoriesResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const categoryIds: string[] = Array.isArray(body?.categoryIds)
    ? body.categoryIds.filter(
        (id: unknown): id is string => typeof id === "string",
      )
    : [];

  const result = await reorderCategories(
    session.token,
    params.serverId,
    categoryIds,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: messageFor(result, CATEGORY_REASONS, CATEGORY_REORDER_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
