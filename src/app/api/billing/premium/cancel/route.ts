import { PREMIUM_CANCEL_FAILED } from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { cancelPremium } from "@/services/billing/service";
import type { PremiumResult } from "@/types/billing.types";

import { billingFailureResponse } from "../../billingRoute";

/** BFF de `POST /v1/billing/premium/cancel`: corta la renovación, no los beneficios ya pagos. */
export async function POST(): Promise<NextResponse<PremiumResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await cancelPremium(session.token);
  if (!result.ok) return billingFailureResponse(result, PREMIUM_CANCEL_FAILED);

  return NextResponse.json({ ok: true, premium: result.data });
}
