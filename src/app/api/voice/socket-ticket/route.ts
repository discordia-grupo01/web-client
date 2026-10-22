import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { createVoiceSocketTicket } from "@/services/voice/service";

export async function POST(): Promise<
  NextResponse<{ ticket: string; expires_in: number } | { ok: false }>
> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await createVoiceSocketTicket(session.token);
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
