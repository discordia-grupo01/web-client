import {
  CHECKOUT_START_FAILED,
  INVALID_DATA_MESSAGE,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { startPointsCheckout } from "@/services/billing/service";
import type { CheckoutResult } from "@/types/billing.types";

import {
  billingFailureResponse,
  idempotencyKeyOf,
  readJsonBody,
} from "../../billingRoute";

/**
 * BFF de `POST /v1/billing/points/checkout`. Devuelve el `purchase_id`, que
 * Mercado Pago también agrega a la URL de vuelta.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<CheckoutResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const body = await readJsonBody(request);
  if (typeof body.package_id !== "string" || body.package_id === "") {
    return NextResponse.json(
      { ok: false, message: INVALID_DATA_MESSAGE },
      { status: 400 },
    );
  }

  const result = await startPointsCheckout(
    session.token,
    { package_id: body.package_id },
    idempotencyKeyOf(request),
  );
  if (!result.ok) return billingFailureResponse(result, CHECKOUT_START_FAILED);

  return NextResponse.json({ ok: true, checkout: result.data });
}
