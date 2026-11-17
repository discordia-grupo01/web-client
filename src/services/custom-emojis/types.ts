import type { CustomEmoji } from "@discordia/client-shared";

/**
 * Forma que devuelve el BFF de `/api/custom-emojis`. Como la de emojis del
 * servidor, vive en web: es el contrato con los Route Handlers de Next.
 */
export type ListCustomEmojisResult =
  { ok: true; emojis: CustomEmoji[] } | { ok: false; message: string };
