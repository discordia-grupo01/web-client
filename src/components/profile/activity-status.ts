/**
 * Estado de actividad (en línea/ausente/no molestar/desconectado). No existe
 * ningún sistema de presencia en identify-service todavía (sin campo, sin
 * websocket): esto es un maquetado puramente visual en el front, sin
 * persistencia ni propagación en tiempo real a otros usuarios.
 */
export type ActivityStatus = "online" | "idle" | "dnd" | "offline";

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  online: "En línea",
  idle: "Ausente",
  dnd: "No molestar",
  offline: "Desconectado",
};

export const ACTIVITY_STATUS_DOT_CLASS: Record<ActivityStatus, string> = {
  online: "bg-success",
  idle: "bg-highlight",
  dnd: "bg-danger",
  offline: "bg-content-subtle",
};
