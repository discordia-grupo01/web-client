import {
  changePasswordFailure,
  type ChangePasswordResult,
  hasErrors,
  PASSWORD_ALREADY_SET,
  PASSWORD_TOO_WEAK,
  SET_PASSWORD_UNAVAILABLE,
  type SetPasswordResult,
  UNEXPECTED_ERROR_MESSAGE,
  validateChangePassword,
  validateSetPassword,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import {
  changeAccountPassword,
  setAccountPassword,
} from "@/services/auth/service";
import { getValidSession } from "@/services/auth/session";

/**
 * BFF de `POST /v1/me/password`: le da una contraseña a una cuenta que nunca
 * tuvo una (alta puramente federada por Google), paso previo a activar el
 * 2FA. No es un cambio de contraseña.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<SetPasswordResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: UNEXPECTED_ERROR_MESSAGE },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (hasErrors(validateSetPassword({ password, confirmPassword }))) {
    return NextResponse.json(
      { ok: false, message: PASSWORD_TOO_WEAK },
      { status: 400 },
    );
  }

  const result = await setAccountPassword(session.token, password);

  if (!result.ok) {
    switch (result.code) {
      case "PASSWORD_ALREADY_SET":
        return NextResponse.json(
          { ok: false, message: PASSWORD_ALREADY_SET, alreadySet: true },
          { status: 409 },
        );

      case "INSECURE_PASSWORD":
        return NextResponse.json(
          { ok: false, message: PASSWORD_TOO_WEAK },
          { status: 400 },
        );

      case "UNAUTHORIZED":
        return unauthorizedResponse();

      default:
        return NextResponse.json(
          { ok: false, message: SET_PASSWORD_UNAVAILABLE },
          { status: 502 },
        );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

/**
 * BFF de `PUT /v1/me/password`: cambia la contraseña de una cuenta que ya
 * tiene una, pidiendo la actual.
 */
export async function PUT(
  request: Request,
): Promise<NextResponse<ChangePasswordResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: UNEXPECTED_ERROR_MESSAGE },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const values = {
    currentPassword: stringField(body.currentPassword),
    newPassword: stringField(body.newPassword),
    confirmPassword: stringField(body.confirmPassword),
  };

  const errors = validateChangePassword(values);
  if (hasErrors(errors)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          errors.currentPassword ??
          errors.newPassword ??
          errors.confirmPassword ??
          UNEXPECTED_ERROR_MESSAGE,
      },
      { status: 400 },
    );
  }

  const result = await changeAccountPassword(session.token, values);
  if (result.ok) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  if (result.status === 401) {
    return unauthorizedResponse();
  }
  return NextResponse.json(changePasswordFailure(result), {
    status: result.status || 502,
  });
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}
