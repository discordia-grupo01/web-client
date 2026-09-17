import { NextResponse } from "next/server";

export const SESSION_EXPIRED = "Tu sesión expiró. Volvé a iniciar sesión.";

/** 401 estándar para los Route Handlers: sin sesión o el backend la rechazó. */
export function unauthorizedResponse(): NextResponse<{
  ok: false;
  message: string;
}> {
  return NextResponse.json(
    { ok: false, message: SESSION_EXPIRED },
    { status: 401 },
  );
}
