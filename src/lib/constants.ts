export const APP_NAME = "Discordia";

export const APP_TAGLINE = "Tu comunidad, sin limites.";

/** Nombre de la cookie httpOnly donde vive la sesion (JWT + datos del usuario). */
export const SESSION_COOKIE = "discordia_session";

/** Rutas de la app. Centralizadas para no hardcodear strings sueltos. */
export const ROUTES = {
  login: "/login",
  register: "/register",
  /** Landing despues de iniciar sesion (por ahora un placeholder). */
  home: "/home",
} as const;
