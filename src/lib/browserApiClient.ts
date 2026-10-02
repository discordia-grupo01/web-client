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
