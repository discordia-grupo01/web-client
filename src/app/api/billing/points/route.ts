import { BILLING_LOAD_FAILED } from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getPointsOverview } from "@/services/billing/service";
import type { PointsOverviewResult } from "@/types/billing.types";

import { billingFailureResponse } from "../billingRoute";

/** BFF de `GET /v1/billing/points`: saldo, últimos movimientos y últimas compras. */
export async function GET(): Promise<NextResponse<PointsOverviewResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await getPointsOverview(session.token);
  if (!result.ok) return billingFailureResponse(result, BILLING_LOAD_FAILED);

  return NextResponse.json({ ok: true, points: result.data });
}
