import { BILLING_LOAD_FAILED } from "@discordia/client-shared";

import { NextResponse, type NextRequest } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getPremium } from "@/services/billing/service";
import type { PremiumResult } from "@/types/billing.types";

import { billingFailureResponse } from "../billingRoute";

/**
 * BFF de `GET /v1/billing/premium`. Con `?refresh=1` billing consulta a
 * Mercado Pago antes de responder: lo usa la pantalla de vuelta del pago.
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<PremiumResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  const result = await getPremium(session.token, { refresh });
  if (!result.ok) return billingFailureResponse(result, BILLING_LOAD_FAILED);

  return NextResponse.json({ ok: true, premium: result.data });
}
