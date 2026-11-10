import type { Message, MessageAuthor } from "@discordia/client-shared";

/** Lo que se reporta, con lo necesario para mostrarlo arriba del modal. */
export type ReportTarget =
  | { kind: "message"; message: Message; author: MessageAuthor }
  | { kind: "user"; userId: string; name: string; avatarSrc: string | null };
