/** Usuario tal como lo devuelve identify-service. */
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

/** Respuesta OK de `POST /v1/login` y `POST /v1/users`. */
export interface AuthResponse {
  user: User;
  token: string;
}

/** Forma de error del backend: `{ error: { code, message, details? } }`. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Lo que guardamos en la cookie httpOnly de sesion. */
export interface Session {
  token: string;
  user: User;
}

/**
 * Resultado que el BFF devuelve al cliente para las acciones de auth. Nunca
 * incluye el token: ese queda solo en la cookie httpOnly.
 */
export type AuthActionResult =
  { ok: true; user: User } | { ok: false; message: string };

/** Resultado de `POST /api/auth/login`. */
export type LoginActionResult = AuthActionResult;

/** Resultado de `POST /api/auth/register`. */
export type RegisterActionResult = AuthActionResult;

/**
 * Resultado de `POST /api/auth/forgot-password`. Nunca lleva datos de usuario:
 * el backend responde igual exista o no el correo, para no permitir enumerar
 * cuentas registradas.
 */
export type ForgotPasswordActionResult =
  { ok: true } | { ok: false; message: string };

/**
 * Resultado de `POST /api/auth/reset-password`. A diferencia de login/register
 * no crea sesion: el backend no devuelve token al cambiar la contrasena.
 */
export type ResetPasswordActionResult =
  { ok: true } | { ok: false; message: string };
