/** Lectura centralizada de variables de entorno. */

export const env = {
  /** URL base del backend (identify-service). */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
};

/** `true` en el build deployado; `false` en `next dev` (localhost). Lo setea Next. */
export const isProduction = process.env.NODE_ENV === "production";
