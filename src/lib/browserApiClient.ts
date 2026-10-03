import axios from "axios";

/**
 * Instancia de axios compartida por todos los `services/<x>/client.ts`.
 * Pega contra este mismo sitio (`/api/*`, mismo origen): la cookie httpOnly
 * viaja sola, nunca hay token que manejar de este lado. (El WebSocket de
 * mensajes tampoco lo ve: usa un ticket de un solo uso, ver `/api/realtime/ticket`.)
 */
export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  validateStatus: () => true,
});

// Las rutas de auth (login, logout, register, el propio chequeo de sesion,
// etc.) no pasan por `ensureFreshSession`: todavia no hay sesion que
// refrescar o, en el caso de `/auth/session`, la llamada ES el refresh (sin
// este corte cada chequeo dispararia otro chequeo, sin fin).
const SESSION_CHECK_EXEMPT_PREFIX = "/auth/";

// Cuanto confiar en un chequeo reciente antes de pedir otro. Tiene que ser
// chico: el access token dura 15 minutos y el candado de
// `services/auth/session.ts` ya cubre los 30s posteriores a un refresh, asi
// que esta ventana no reemplaza esa proteccion -- solo evita pedir
// `/api/auth/session` de nuevo para cada click suelto cuando el anterior
// chequeo (de hace un instante) ya confirmo que la sesion estaba bien.
const SESSION_CHECK_TTL_MS = 2_000;

// Single-flight por pestaña: mientras un chequeo de sesion esta en vuelo,
// cualquier otro request que dispare el interceptor reutiliza la MISMA
// promesa en lugar de arrancar la suya. Fuera de eso, `lastCheckedAt` evita
// repetir el chequeo si el ultimo resultado (en vuelo o resuelto) es de hace
// menos de `SESSION_CHECK_TTL_MS`.
//
// Por que hace falta esto ademas del candado que ya tiene
// `services/auth/session.ts` (`globalThis.__discordiaRefreshes`): ese
// candado vive en el proceso de Next, pero en produccion (Vercel) cada Route
// Handler corre como su propia funcion serverless, sin memoria compartida
// entre si. Si una pantalla dispara varios requests a la vez -- por ejemplo
// `/api/servers`, `/api/members` y `/api/messages` al entrar a un canal --
// cada uno puede caer en una instancia distinta: el candado de `session.ts`
// no los coordina, y dos pueden terminar refrescando con el mismo refresh
// token a la vez. identify-service rota el refresh token en cada uso y trata
// la reutilizacion como un posible robo: revoca TODA la familia y la sesion
// queda cerrada ("Tu sesión expiró. Volvé a iniciar sesión.") aunque el
// usuario seguia activo.
//
// Coordinando el refresh ACA, en el navegador (un solo proceso de JS por
// pestaña, a diferencia del backend), el problema desaparece sin importar
// como Vercel reparta las funciones: antes de cualquier request autenticado,
// la pestaña espera a que termine (o dispara) un unico
// `GET /api/auth/session`, que adentro llama a `getValidSession()` y rota el
// refresh token una sola vez si hacia falta.
let pendingSessionCheck: Promise<void> | null = null;
let lastCheckedAt = 0;

function ensureFreshSession(): Promise<void> {
  if (pendingSessionCheck) return pendingSessionCheck;

  if (Date.now() - lastCheckedAt < SESSION_CHECK_TTL_MS) {
    return Promise.resolve();
  }

  pendingSessionCheck = api
    .get("/auth/session")
    .then(
      () => undefined,
      () => undefined,
    )
    .finally(() => {
      lastCheckedAt = Date.now();
      pendingSessionCheck = null;
    });
  return pendingSessionCheck;
}

api.interceptors.request.use(async (config) => {
  const url = config.url ?? "";
  if (!url.startsWith(SESSION_CHECK_EXEMPT_PREFIX)) {
    await ensureFreshSession();
  }
  return config;
});
