import { NextResponse } from "next/server";

import { register } from "@/features/auth/service";
import { createSession } from "@/features/auth/session";
import type { RegisterActionResult } from "@/features/auth/types";
import { hasErrors, validateRegister } from "@/features/auth/validation";

/**
 * BFF de registro. El navegador pega aca (mismo origen); este handler llama a
 * `POST /v1/users` de identify-service y, si la cuenta se crea, guarda el JWT
 * en una cookie httpOnly. El token nunca vuelve al navegador: el registro deja
 * al usuario con sesion iniciada, igual que el login.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<RegisterActionResult>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Peticion invalida." },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name : "";
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (hasErrors(validateRegister({ name, email, password }))) {
    return NextResponse.json(
      { ok: false, message: "Revisa los datos ingresados." },
      { status: 400 },
    );
  }

  const result = await register({
    name: name.trim(),
    email: email.trim(),
    password,
  });

  if (!result.ok) {
    // 409: ya existe una cuenta con ese correo.
    if (result.status === 409) {
      return NextResponse.json(
        {
          ok: false,
          message: "Ya existe una cuenta con ese correo electronico.",
        },
        { status: 409 },
      );
    }

    // 400/422: datos invalidos o contrasena insegura (el backend es la autoridad).
    if (result.status === 400 || result.status === 422) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Revisa los datos: la contrasena necesita 8+ caracteres con mayuscula, minuscula y numero.",
        },
        { status: 400 },
      );
    }

    // Red caida, timeout o error del backend (5xx, 404, ...): servicio no disponible.
    return NextResponse.json(
      {
        ok: false,
        message:
          "No pudimos crear tu cuenta en este momento. Intenta de nuevo mas tarde.",
      },
      { status: 502 },
    );
  }

  createSession({ token: result.data.token, user: result.data.user });

  return NextResponse.json(
    { ok: true, user: result.data.user },
    { status: 201 },
  );
}
