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
 * Resultado que el BFF devuelve al cliente. Nunca incluye el token:
 * ese queda solo en la cookie httpOnly.
 */
export type LoginActionResult =
  { ok: true; user: User } | { ok: false; message: string };
