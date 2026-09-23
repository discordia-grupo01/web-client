import type { SessionBase } from "@discordia/client-shared";

/**
 * Lo unico de auth que es propio de web-client. Todo lo demas (`User`,
 * `AuthResponse`, los resultados de cada accion) sale de
 * `@discordia/client-shared`: lo define el backend, no esta app.
 */
export interface Session extends SessionBase {
  /**
   * Refresh token de identify-service, rota en cada `/v1/refresh`. No esta en
   * `SessionBase` porque en `app-mobile` vive en una cookie nativa que el JS
   * nunca ve.
   */
  refreshToken: string;
}

