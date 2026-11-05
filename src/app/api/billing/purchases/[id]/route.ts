import { PAYMENT_STATUS_FAILED } from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getPurchase } from "@/services/billing/service";
import type { PurchaseResult } from "@/types/billing.types";

import { billingFailureResponse } from "../../billingRoute";

/**
 * BFF de `GET /v1/billing/purchases/:id`. Una compra de otro usuario también
 * es 404 `PURCHASE_NOT_FOUND`, así que no se pueden adivinar ids.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<PurchaseResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await getPurchase(session.token, params.id);
  if (!result.ok) return billingFailureResponse(result, PAYMENT_STATUS_FAILED);

  return NextResponse.json({ ok: true, purchase: result.data });
}
