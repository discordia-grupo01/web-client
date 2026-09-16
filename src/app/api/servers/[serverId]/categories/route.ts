import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getSession } from "@/services/auth/session";
import { createCategory } from "@/services/categories/service";
import type { CreateCategoryActionResult } from "@/types/category.types";

const REASON_MESSAGES: Record<string, string> = {
  name_required: "Ingresá un nombre para la categoría.",
  name_too_long: "El nombre es demasiado largo.",
  name_invalid_chars: "El nombre tiene caracteres invalidos.",
};

/**
 * BFF de `POST /v1/servers/:id/categories`. Body JSON: `{ name }`.
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<CreateCategoryActionResult>> {
  const session = getSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";

  const result = await createCategory(session.token, params.serverId, name);

  if (!result.ok) {
    const field =
      typeof result.details?.field === "string"
        ? result.details.field
        : undefined;
    const reason =
      typeof result.details?.reason === "string"
        ? result.details.reason
        : undefined;
    const friendly = reason ? REASON_MESSAGES[reason] : undefined;

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
        message: friendly ?? "No pudimos crear la categoría. Intenta de nuevo.",
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
