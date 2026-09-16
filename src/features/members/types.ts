/**
 * Miembro tal como lo devuelve `GET /v1/servers/:id/members`. El backend solo
 * conoce el `user_id`; el nombre se resuelve aparte contra identify-service
 * (`getPublicProfileRequest`, ver `features/auth/client.ts`), uno por
 * miembro -- no hay un endpoint batch todavia.
 */
export interface Member {
  user_id: string;
  is_owner: boolean;
  joined_at: string;
}

/** Resultado de `GET /api/servers/:id/members`. */
export type ListMembersActionResult =
  | { ok: true; members: Member[]; total: number }
  | { ok: false; message: string };
