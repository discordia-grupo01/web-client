import { CHECKOUT_START_FAILED } from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { startPremiumCheckout } from "@/services/billing/service";
import type { CheckoutResult } from "@/types/billing.types";

import {
  billingFailureResponse,
  idempotencyKeyOf,
  readJsonBody,
} from "../../billingRoute";

/** BFF de `POST /v1/billing/premium/checkout`: devuelve la página de Mercado Pago. */
export async function POST(
  request: Request,
): Promise<NextResponse<CheckoutResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const body = await readJsonBody(request);
  const payerEmail =
    typeof body.payer_email === "string" ? body.payer_email.trim() : "";

  const result = await startPremiumCheckout(
    session.token,
    payerEmail ? { payer_email: payerEmail } : {},
    idempotencyKeyOf(request),
  );
  if (!result.ok) return billingFailureResponse(result, CHECKOUT_START_FAILED);

  return NextResponse.json({ ok: true, checkout: result.data });
}
