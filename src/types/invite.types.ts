import type { ServerSummary } from "./server.types";

/** Invitación tal como la devuelve `servers` (create o get). */
export interface Invitation {
  code: string;
  url: string;
  server_id: string;
  created_by: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface CreateInviteFieldErrors {
  max_uses?: string;
}

/** Resultado de `POST /api/servers/:id/invites`. */
export type CreateInviteActionResult =
  | { ok: true; invitation: Invitation }
  | { ok: false; message: string; fieldErrors?: CreateInviteFieldErrors };

/** Resultado de `DELETE /api/invites/:code`. Idempotente del lado del back. */
export type RevokeInviteActionResult =
  { ok: true } | { ok: false; message: string };

/**
 * Resultado de `GET /api/servers/:id/invites`. Trae TODAS las invitaciones
 * del server (activas, revocadas o vencidas), más nuevas primero. El back no
 * filtra por estado ni limita a una activa por server -- el front calcula el
 * estado de cada una (ver `inviteStatus` en invite-modal.tsx).
 */
export type ListInvitationsActionResult =
  { ok: true; invitations: Invitation[] } | { ok: false; message: string };

export interface JoinServerFieldErrors {
  code?: string;
}

/** Resultado de `POST /api/invites/:code/join`. */
export type JoinServerActionResult =
  | { ok: true; server: ServerSummary; alreadyMember: boolean }
  | { ok: false; message: string; fieldErrors?: JoinServerFieldErrors };
