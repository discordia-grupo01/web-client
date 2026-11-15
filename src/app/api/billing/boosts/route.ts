import {
  BOOST_REQUEST_FAILED,
  BOOSTS_LIST_LOAD_ERROR,
  INVALID_DATA_MESSAGE,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listBoosts, requestBoost } from "@/services/billing/service";
import type { BoostResult, BoostsResult } from "@/types/billing.types";

import {
  billingFailureResponse,
  idempotencyKeyOf,
  readJsonBody,
} from "../billingRoute";

/** BFF de `GET /v1/billing/boosts`: mis boosts de todos los servidores. */
export async function GET(): Promise<NextResponse<BoostsResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await listBoosts(session.token);
  if (!result.ok) return billingFailureResponse(result, BOOSTS_LIST_LOAD_ERROR);

  return NextResponse.json({ ok: true, boosts: result.data.boosts });
}

/**
 * BFF de `POST /v1/billing/boosts`. Responde con el boost en `pending`: queda
 * activo cuando servers lo acepta.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<BoostResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const body = await readJsonBody(request);
  if (typeof body.server_id !== "string" || body.server_id === "") {
    return NextResponse.json(
      { ok: false, message: INVALID_DATA_MESSAGE },
      { status: 400 },
    );
  }

  const result = await requestBoost(
    session.token,
    body.server_id,
    idempotencyKeyOf(request),
  );
  if (!result.ok) return billingFailureResponse(result, BOOST_REQUEST_FAILED);

  return NextResponse.json({ ok: true, boost: result.data }, { status: 202 });
}
