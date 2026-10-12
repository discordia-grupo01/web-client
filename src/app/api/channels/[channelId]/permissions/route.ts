import {
  type ApiFailure,
  CHANNEL_NOT_FOUND,
  CHANNEL_OVERRIDE_PERMISSIONS,
  CHANNEL_OVERRIDE_REASONS,
  CHANNEL_PERMISSIONS_LOAD_FAILED,
  CHANNEL_PERMISSIONS_SAVE_FAILED,
  type ChannelOverridePermission,
  type DeleteChannelOverrideResult,
  type ListChannelOverridesResult,
  messageFor,
  OWNER_ONLY_OVERRIDE_CHANNEL_PERMISSIONS,
  permissionNotHeldMessage,
  reasonOf,
  type SetChannelOverrideResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import {
  deleteChannelOverride,
  listChannelOverrides,
  setChannelOverride,
} from "@/services/channel-permissions/service";

type RouteContext = { params: { channelId: string } };

interface ChannelOverrideErrorPayload {
  ok: false;
  message: string;
  permissionDenied?: boolean;
}

/**
 * Traduce un fallo de los endpoints de excepciones de un canal. El 401 lo
 * resuelve cada ruta antes de llegar aca.
 *
 * Un 403 sin `reason` es que el actor no tiene MANAGE_ROLES: se marca con
 * `permissionDenied` para que la pantalla deje de ofrecer la edicion.
 */
function channelOverrideErrorResponse(
  failure: ApiFailure,
  fallback: string,
): { payload: ChannelOverrideErrorPayload; status: number } {
  const status =
    failure.status >= 400 && failure.status < 500 ? failure.status : 502;
  const reason = reasonOf(failure.details);

  if (reason === "permission_not_held") {
    return {
      payload: {
        ok: false,
        message: permissionNotHeldMessage(failure.details?.permissions),
      },
      status,
    };
  }
  if (reason && CHANNEL_OVERRIDE_REASONS[reason]) {
    return {
      payload: { ok: false, message: CHANNEL_OVERRIDE_REASONS[reason] },
      status,
    };
  }
  if (failure.status === 403) {
    return {
      payload: {
        ok: false,
        message: OWNER_ONLY_OVERRIDE_CHANNEL_PERMISSIONS,
        permissionDenied: true,
      },
      status,
    };
  }
  if (failure.status === 404) {
    return { payload: { ok: false, message: CHANNEL_NOT_FOUND }, status };
  }
  return {
    payload: {
      ok: false,
      message: messageFor(failure, CHANNEL_OVERRIDE_REASONS, fallback),
    },
    status,
  };
}

/**
 * BFF de las excepciones de permisos de un canal. El rol va en el body
 * (`roleId`) en vez de en la URL: es un solo recurso por canal y asi la ruta
 * queda en un unico archivo.
 */

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<ListChannelOverridesResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listChannelOverrides(session.token, params.channelId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    const { payload, status } = channelOverrideErrorResponse(
      result,
      CHANNEL_PERMISSIONS_LOAD_FAILED,
    );
    return NextResponse.json(payload, { status });
  }

  return NextResponse.json(
    { ok: true, overrides: result.data },
    { status: 200 },
  );
}

function permissionsOf(value: unknown): ChannelOverridePermission[] | null {
  if (!Array.isArray(value)) return null;
  const known = value.filter((item): item is ChannelOverridePermission =>
    (CHANNEL_OVERRIDE_PERMISSIONS as readonly unknown[]).includes(item),
  );
  return known.length === value.length ? known : null;
}

function invalidBody(): NextResponse<{ ok: false; message: string }> {
  return NextResponse.json(
    { ok: false, message: CHANNEL_PERMISSIONS_SAVE_FAILED },
    { status: 400 },
  );
}

/** Body: `{ roleId, allow, deny }`. Con las dos listas vacias se borra la excepcion. */
export async function PUT(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<SetChannelOverrideResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const roleId = typeof body?.roleId === "string" ? body.roleId : "";
  if (!roleId) return invalidBody();
  const allow = permissionsOf(body?.allow);
  const deny = permissionsOf(body?.deny);
  if (!allow || !deny) {
    return NextResponse.json(
      {
        ok: false,
        message: CHANNEL_OVERRIDE_REASONS.permission_not_overridable,
      },
      { status: 400 },
    );
  }

  const result = await setChannelOverride(
    session.token,
    params.channelId,
    roleId,
    { allow, deny },
  );
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    const { payload, status } = channelOverrideErrorResponse(
      result,
      CHANNEL_PERMISSIONS_SAVE_FAILED,
    );
    return NextResponse.json(payload, { status });
  }

  return NextResponse.json(
    { ok: true, override: result.status === 204 ? null : result.data },
    { status: 200 },
  );
}

/**
 * Body: `{ roleId }`. Que el rol ya no tuviera excepcion cuenta como exito:
 * el resultado es el mismo que se queria.
 */
export async function DELETE(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<DeleteChannelOverrideResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const roleId = typeof body?.roleId === "string" ? body.roleId : "";
  if (!roleId) return invalidBody();

  const result = await deleteChannelOverride(
    session.token,
    params.channelId,
    roleId,
  );
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (reasonOf(result.details) === "channel_override_not_found") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    const { payload, status } = channelOverrideErrorResponse(
      result,
      CHANNEL_PERMISSIONS_SAVE_FAILED,
    );
    return NextResponse.json(payload, { status });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
