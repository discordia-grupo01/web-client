export const APP_NAME = "Discordia";

/** Nombre de la cookie httpOnly donde vive la sesion (JWT + datos del usuario). */
export const SESSION_COOKIE = "discordia_session";

/** Rutas de la app. Centralizadas para no hardcodear strings sueltos. */
export const ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  confirmEmail: "/confirm-email",
  /** Landing despues de iniciar sesion (por ahora un placeholder). */
  home: "/home",
  invite: "/invite",
} as const;
