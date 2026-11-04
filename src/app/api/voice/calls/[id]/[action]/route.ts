import {
  type AcceptPrivateCallResult,
  parseAcceptedPrivateCall,
  PRIVATE_CALL_ACCEPT_FAILED,
  PRIVATE_CALL_END_FAILED,
  type PrivateCallActionResult,
  voiceErrorMessage,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import {
  privateCallAction,
  type PrivateCallAction,
} from "@/services/voice/service";

const ACTIONS: readonly PrivateCallAction[] = ["accept", "reject", "finish"];

function isAction(value: string): value is PrivateCallAction {
  return (ACTIONS as readonly string[]).includes(value);
}

/**
 * BFF de `POST /api/voice/calls/:id/{accept,reject,finish}`. Sin body:
 * tambien lo usa `navigator.sendBeacon` al cerrar la pestaña.
 *
 * - `accept` devuelve la llamada con las credenciales de LiveKit.
 * - `reject` rechaza (quien recibe) o cancela (quien llama) mientras suena.
 * - `finish` corta la llamada en curso.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string; action: string } },
): Promise<NextResponse<AcceptPrivateCallResult | PrivateCallActionResult>> {
  const { id, action } = params;
  if (!isAction(action)) {
    return NextResponse.json(
      { ok: false, message: PRIVATE_CALL_END_FAILED },
      { status: 404 },
    );
  }

  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const fallback =
    action === "accept" ? PRIVATE_CALL_ACCEPT_FAILED : PRIVATE_CALL_END_FAILED;
  const result = await privateCallAction(session.token, id, action);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: voiceErrorMessage(result.code, fallback) },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  if (action !== "accept") {
    return NextResponse.json({ ok: true });
  }

  const call = parseAcceptedPrivateCall(result.data);
  if (!call) {
    return NextResponse.json({ ok: false, message: fallback }, { status: 502 });
  }
  return NextResponse.json(
    { ok: true, call },
    { headers: { "Cache-Control": "no-store" } },
  );
}
