import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { createRole, listRoles } from "@/services/roles/service";
import type {
  CreateRoleActionResult,
  ListRolesActionResult,
} from "@/types/role.types";

const REASON_MESSAGES: Record<string, string> = {
  name_required: "Ingresá un nombre para el rol.",
  name_too_long: "El nombre es demasiado largo.",
  color_invalid_format: "Elegí un color válido para el rol.",
};

/**
 * BFF de `GET /v1/servers/:id/roles`. Trae todos los roles del server.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ListRolesActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listRoles(session.token, params.serverId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: "No pudimos cargar los roles. Intenta de nuevo." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, roles: result.data }, { status: 200 });
}

/**
 * BFF de `POST /v1/servers/:id/roles`. Body JSON: `{ name, color }`. Un rol
 * nuevo se crea sin permisos habilitados (el back no acepta permisos en la
 * creacion, solo en la edicion). Solo el owner del server puede crear roles.
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<CreateRoleActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const color = typeof body?.color === "string" ? body.color : "";

  const result = await createRole(session.token, params.serverId, {
    name,
    color,
  });

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

    if ((field === "name" || field === "color") && friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { [field]: friendly } },
        { status: result.status || 400 },
      );
    }
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: "No tenés permisos de administración para crear roles.",
        },
        { status: 403 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: friendly ?? "No pudimos crear el rol. Intenta de nuevo.",
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, role: result.data }, { status: 201 });
}
