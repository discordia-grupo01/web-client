import { createSocketManager } from "@discordia/client-shared";
import { Socket } from "phoenix";

import { env } from "@/lib/env";

import { fetchSocketTicketRequest } from "./client";

/**
 * Socket de mensajes de la pestana. La conexion, los tickets y la reconexion
 * viven en `createSocketManager` (`@discordia/client-shared`); aca solo va lo
 * propio del navegador.
 */
export const { acquireSocket, closeSocket, onSocketSessionExpired } =
  createSocketManager({
    createSocket: (params) => new Socket(env.wsUrl, { params }),
    fetchTicket: fetchSocketTicketRequest,
    // Phoenix cierra el socket solo al irse la pagina (`pagehide`) y lo vuelve a
    // abrir al volver (`pageshow`, con el ticket ya gastado: falla y se pide
    // uno nuevo). Mientras se va, ese cierre no se reconecta.
    watchLifecycle: ({ suspendReconnect }) => {
      const onPageHide = () => suspendReconnect(true);
      const onPageShow = () => suspendReconnect(false);
      window.addEventListener("pagehide", onPageHide);
      window.addEventListener("pageshow", onPageShow);
      return () => {
        window.removeEventListener("pagehide", onPageHide);
        window.removeEventListener("pageshow", onPageShow);
      };
    },
  });
