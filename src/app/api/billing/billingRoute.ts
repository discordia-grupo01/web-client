import {
  type ApiFailure,
  billingErrorMessage,
  isBillingErrorCode,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import type { BillingFailure } from "@/types/billing.types";

export function billingFailureResponse(
  result: ApiFailure,
  fallbackMessage: string,
): NextResponse<BillingFailure> {
  if (result.status === 401) return unauthorizedResponse();

  const code = isBillingErrorCode(result.code) ? result.code : null;
  const unknownMessage = result.status === 0 ? result.message : fallbackMessage;
  return NextResponse.json(
    {
      ok: false,
      message: code ? billingErrorMessage(code) : unknownMessage,
      ...(code ? { code } : {}),
    },
    {
      status: result.status >= 400 && result.status < 500 ? result.status : 502,
    },
  );
}

export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function idempotencyKeyOf(request: Request): string | undefined {
  return request.headers.get("Idempotency-Key")?.trim() || undefined;
}
