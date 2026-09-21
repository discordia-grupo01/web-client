import {
  CATEGORY_CREATE_FAILED,
  CATEGORY_REASONS,
  type CreateCategoryResult,
  fieldOf,
  messageFor,
  reasonOf,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { createCategory } from "@/services/categories/service";

/**
 * BFF de `POST /v1/servers/:id/categories`. Body JSON: `{ name }`.
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<CreateCategoryResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";

  const result = await createCategory(session.token, params.serverId, name);

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
        message: messageFor(result, CATEGORY_REASONS, CATEGORY_CREATE_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, category: result.data },
    { status: 201 },
  );
}
