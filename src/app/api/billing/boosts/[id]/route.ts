import {
  BOOST_REMOVE_FAILED,
  BOOST_STATUS_FAILED,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getBoost, removeBoost } from "@/services/billing/service";
import type { BoostResult } from "@/types/billing.types";

import { billingFailureResponse } from "../../billingRoute";

interface Params {
  params: { id: string };
}

/** BFF de `GET /v1/billing/boosts/:id`. Un boost ajeno es 404. */
export async function GET(
  _request: Request,
  { params }: Params,
): Promise<NextResponse<BoostResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await getBoost(session.token, params.id);
  if (!result.ok) return billingFailureResponse(result, BOOST_STATUS_FAILED);

  return NextResponse.json({ ok: true, boost: result.data });
}

/** BFF de `DELETE /v1/billing/boosts/:id`: retira un boost activo, sin reembolso. */
export async function DELETE(
  _request: Request,
  { params }: Params,
): Promise<NextResponse<BoostResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await removeBoost(session.token, params.id);
  if (!result.ok) return billingFailureResponse(result, BOOST_REMOVE_FAILED);

  return NextResponse.json({ ok: true, boost: result.data });
}
