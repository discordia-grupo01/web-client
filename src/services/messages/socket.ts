import { Socket } from "phoenix";

import { env } from "@/lib/env";

import { fetchSocketTicketRequest } from "./client";

/**
 * Manager del WebSocket de mensajes: UN solo `Socket` por pestana, no uno por
 * canal. Cambiar de canal es hacer `leave` + `join` sobre el mismo socket.
 *
 * Vive fuera de React a proposito: es una conexion de larga duracion que tiene
 * que sobrevivir a los re-renders. Los hooks piden el socket con
 * `acquireSocket()` y lo sueltan con `release()`; cuando no queda nadie lo
 * usando, se cierra a los pocos segundos (no al instante, porque al cambiar de
 * canal el chat se desmonta y se vuelve a montar enseguida).
 *
 * Autenticacion: el handshake de un WebSocket no admite headers y el JWT en la
 * URL queda en los logs, asi que messaging usa tickets (`POST
 * /v1/socket-tickets`, via el BFF): de un solo uso y con 30 s de vida. Por eso
 * CADA conexion, incluidas las reconexiones, necesita un ticket nuevo, y Phoenix
 * no sirve para reconectar solo (reintentaria con el ticket ya gastado). La
 * reconexion la maneja este modulo: cuando el socket se cierra, pide un ticket
 * y vuelve a abrir. Los canales se vuelven a unir solos (con `since`) al abrirse.
 *
 * El JWT que messaging guarda con el ticket solo lo usa para consultar
 * permisos a `servers`, que no valida su expiracion (solo lee el `sub`), asi que
 * un socket abierto mucho tiempo sigue funcionando sin renovar nada.
 */

const IDLE_CLOSE_MS = 5 * 1000;
/** Espera entre intentos de conseguir un ticket (backoff hasta el maximo). */
const RETRY_MIN_MS = 1 * 1000;
const RETRY_MAX_MS = 10 * 1000;

interface SocketState {
  socket: Socket;
  /** Ticket listo para el proximo `connect()`; Phoenix lo consume al leer los params. */
  ticket: string | null;
  leases: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  /** Hay una reconexion en curso: ignora cierres hasta que termine. */
  reconnecting: boolean;
  /** Cierres seguidos sin llegar a abrir: si el servidor rechaza siempre, no martillar. */
  failures: number;
  /** La pagina se esta yendo (Phoenix cierra el socket a proposito): no reconectar. */
  pageHiding: boolean;
  stopPageListeners: () => void;
}

export interface SocketLease {
  socket: Socket;
  /** Suelta el socket. Idempotente. */
  release: () => void;
}

export type AcquireSocketResult =
  ({ ok: true } & SocketLease) | { ok: false; sessionExpired: boolean };

let state: SocketState | null = null;
let opening: Promise<true | { sessionExpired: boolean }> | null = null;
const sessionExpiredListeners = new Set<() => void>();

/** Avisa cuando la sesion murio y el socket se cerro (no hay forma de seguir). */
export function onSocketSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

export async function acquireSocket(): Promise<AcquireSocketResult> {
  if (!state) {
    opening ??= openSocket().finally(() => {
      opening = null;
    });
    const result = await opening;
    if (result !== true || !state) {
      return {
        ok: false,
        sessionExpired:
          typeof result === "object" ? result.sessionExpired : false,
      };
    }
  }
  return { ok: true, ...lease(state) };
}

function lease(current: SocketState): SocketLease {
  if (current.idleTimer) {
    clearTimeout(current.idleTimer);
    current.idleTimer = null;
  }
  current.leases += 1;

  let released = false;
  return {
    socket: current.socket,
    release: () => {
      if (released) return;
      released = true;
      current.leases -= 1;
      if (current.leases === 0 && state === current) {
        current.idleTimer = setTimeout(closeSocket, IDLE_CLOSE_MS);
      }
    },
  };
}

async function openSocket(): Promise<true | { sessionExpired: boolean }> {
  const first = await fetchSocketTicketRequest();
  if (!first.ok) return { sessionExpired: first.sessionExpired };

  const socket = new Socket(env.wsUrl, {
    // Phoenix lee los params en cada `connect()`. El ticket es de un solo uso:
    // se entrega y se descarta, y la proxima conexion pide otro.
    params: () => {
      const ticket = current.ticket ?? "";
      current.ticket = null;
      return { ticket };
    },
  });
  const current: SocketState = {
    socket,
    ticket: first.ticket,
    leases: 0,
    idleTimer: null,
    retryTimer: null,
    reconnecting: false,
    failures: 0,
    pageHiding: false,
    stopPageListeners: () => {},
  };
  state = current;

  // Phoenix cierra el socket solo al irse la pagina (`pagehide`) y lo vuelve a
  // abrir al volver (`pageshow`, con el ticket ya gastado: falla y cae en
  // `handleClose`, que pide uno nuevo).
  const onPageHide = () => {
    current.pageHiding = true;
  };
  const onPageShow = () => {
    current.pageHiding = false;
  };
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  current.stopPageListeners = () => {
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
  };

  socket.onOpen(() => {
    current.failures = 0;
  });
  socket.onClose(() => handleClose(current));
  socket.connect();
  return true;
}

/**
 * El socket se cerro (se corto la red, el handshake fue rechazado, el servidor
 * se reinicio): se vuelve a abrir con un ticket nuevo. `disconnect` cancela la
 * reconexion automatica de Phoenix, que usaria el ticket ya gastado.
 */
function handleClose(current: SocketState): void {
  if (state !== current || current.reconnecting || current.pageHiding) return;
  current.reconnecting = true;
  current.failures += 1;
  current.socket.disconnect(() => {
    void reconnect(current);
  });
}

async function reconnect(current: SocketState): Promise<void> {
  let delayMs = RETRY_MIN_MS;
  // El primer cierre se reintenta enseguida; si el siguiente tambien cierra sin
  // abrir, se espera cada vez mas (1 s, 2 s... hasta 10 s).
  if (current.failures > 1) {
    const backoffMs = Math.min(
      RETRY_MIN_MS * 2 ** (current.failures - 2),
      RETRY_MAX_MS,
    );
    await new Promise<void>((resolve) => {
      current.retryTimer = setTimeout(resolve, backoffMs);
    });
  }
  while (state === current) {
    const result = await fetchSocketTicketRequest();
    if (state !== current) return;

    if (result.ok) {
      current.ticket = result.ticket;
      current.reconnecting = false;
      current.socket.connect();
      return;
    }
    if (result.sessionExpired) {
      closeSocket();
      sessionExpiredListeners.forEach((listener) => listener());
      return;
    }

    // Fallo transitorio (sin red, servicio caido): se reintenta con backoff.
    await new Promise<void>((resolve) => {
      current.retryTimer = setTimeout(resolve, delayMs);
    });
    delayMs = Math.min(delayMs * 2, RETRY_MAX_MS);
  }
}

/** Cierra el socket y limpia los timers. Un `acquireSocket` posterior abre uno nuevo. */
export function closeSocket(): void {
  const current = state;
  if (!current) return;
  state = null;
  if (current.idleTimer) clearTimeout(current.idleTimer);
  if (current.retryTimer) clearTimeout(current.retryTimer);
  current.stopPageListeners();
  current.socket.disconnect();
}
