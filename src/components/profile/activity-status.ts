import type { ActivityStatus } from "@discordia/client-shared";

/**
 * Lo unico que queda local: el color de cada estado en clases de Tailwind.
 * El tipo, las etiquetas y las descripciones estan en `client-shared`, porque
 * son las mismas que usa `app-mobile` con su propia paleta.
 */
export const ACTIVITY_STATUS_DOT_CLASS: Record<ActivityStatus, string> = {
  online: "bg-success",
  dnd: "bg-danger",
  offline: "bg-content-subtle",
};
