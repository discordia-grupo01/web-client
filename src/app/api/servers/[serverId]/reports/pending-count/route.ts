import { type PendingReportsCount } from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { countPendingReports } from "@/services/reports/service";

/**
 * Total de reportes pendientes para el indicador del riel. Responde 200
 * siempre (salvo sesion vencida): quien no es moderador recibe 0, asi el
 * navegador nunca ve un 403 por esto.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<PendingReportsCount | { ok: false; message: string }>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const total = await countPendingReports(
    session.token,
    params.serverId,
    session.user.id,
  );
  return NextResponse.json({ total });
}
