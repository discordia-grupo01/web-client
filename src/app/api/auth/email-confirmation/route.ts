import {
  hasErrors,
  INVALID_EMAIL_MESSAGE,
  type EmailConfirmationResult,
  type ForgotPasswordValues,
  validateForgotPassword,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { requestEmailConfirmation } from "@/services/auth/service";

export async function POST(
  request: Request,
): Promise<NextResponse<EmailConfirmationResult>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Formato de petición inválido." },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email : "";
  const values: ForgotPasswordValues = { email };

  if (hasErrors(validateForgotPassword(values))) {
    return NextResponse.json(
      { ok: false, message: INVALID_EMAIL_MESSAGE },
      { status: 400 },
    );
  }

  const result = await requestEmailConfirmation(email.trim());
  if (!result.ok) {
    if (result.code === "EMAIL_CONFIRMATION_RATE_LIMITED") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Alcanzaste el límite de reenvíos. Intenta nuevamente más tarde.",
        },
        { status: 429 },
      );
    }

    if (result.code === "INVALID_INPUT") {
      return NextResponse.json(
        { ok: false, message: INVALID_EMAIL_MESSAGE },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos enviar el correo. Intenta nuevamente.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
