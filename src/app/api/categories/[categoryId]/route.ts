import {
  CATEGORY_REASONS,
  CATEGORY_UPDATE_FAILED,
  fieldOf,
  messageFor,
  reasonOf,
  type UpdateCategoryResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { updateCategory } from "@/services/categories/service";

/**
 * BFF de `PATCH /v1/categories/:id`. Body JSON: `{ name }`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { categoryId: string } },
): Promise<NextResponse<UpdateCategoryResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";

  const result = await updateCategory(session.token, params.categoryId, name);

  if (!result.ok) {
    const field = fieldOf(result.details);
    const reason = reasonOf(result.details);
    const friendly = reason ? CATEGORY_REASONS[reason] : undefined;

    if (field === "name" && friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { name: friendly } },
        { status: result.status || 400 },
      );
    }
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: messageFor(result, CATEGORY_REASONS, CATEGORY_UPDATE_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, category: result.data },
    { status: 200 },
  );
}
