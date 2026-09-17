/** Canal tal como viene embebido en la respuesta de un servidor. */
export interface Channel {
  id: string;
  name: string;
  kind: "text" | "voice";
  position: number;
  category_id: string | null;
  topic: string | null;
}

export interface CreateChannelFieldErrors {
  name?: string;
  kind?: string;
  category_id?: string;
}

/** Resultado de `POST /api/servers/:id/channels`. */
export type CreateChannelActionResult =
  | { ok: true; channel: Channel }
  | { ok: false; message: string; fieldErrors?: CreateChannelFieldErrors };

export interface UpdateChannelFieldErrors {
  name?: string;
}

/** Resultado de `PATCH /api/channels/:id`. */
export type UpdateChannelActionResult =
  | { ok: true; channel: Channel }
  | { ok: false; message: string; fieldErrors?: UpdateChannelFieldErrors };

/** Resultado de `DELETE /api/channels/:id`. */
export type DeleteChannelActionResult =
  { ok: true } | { ok: false; message: string };

/** Resultado de `PATCH /api/channels/:id/category`. */
export type MoveChannelActionResult =
  { ok: true; channel: Channel } | { ok: false; message: string };

/**
 * Resultado de `PATCH /api/servers/:id/channels/reorder`. El back exige que
 * `channelIds` sea exactamente el set de canales que ya está en esa
 * categoría (o en "sin categoría" si es `null`), ni más ni menos.
 */
export type ReorderChannelsActionResult =
  { ok: true } | { ok: false; message: string };
