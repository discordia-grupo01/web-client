import { BILLING_LOAD_FAILED } from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listPointsPackages } from "@/services/billing/service";
import type { PointsPackagesResult } from "@/types/billing.types";

import { billingFailureResponse } from "../../billingRoute";

/** BFF de `GET /v1/billing/points/packages`: los paquetes salen del back, no se hardcodean. */
export async function GET(): Promise<NextResponse<PointsPackagesResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await listPointsPackages(session.token);
  if (!result.ok) return billingFailureResponse(result, BILLING_LOAD_FAILED);

  return NextResponse.json({ ok: true, packages: result.data.packages });
}
