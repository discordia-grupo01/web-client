import {
  type CreateInviteResult,
  INVITE_CREATE_FAILED,
  INVITE_REVOKE_FAILED,
  INVITES_LOAD_FAILED,
  type JoinServerResult,
  type ListInvitationsResult,
  REQUEST_FAILED_MESSAGE,
  type RevokeInviteResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

/**
 * Llamadas del navegador hacia el BFF (`/api/invites`, `/api/servers/:id/invites`,
 * mismo origen). Nunca pega directo al gateway: el JWT nunca sale del
 * servidor de Next.
 */

/** Acepta tanto un link completo (".../xY7z2Q") como el código pelado. */
export function normalizeInviteCode(raw: string): string {
  const match = raw.trim().match(/([A-Za-z0-9_-]{4,20})$/);
  return match ? match[1] : raw.trim();
}

export async function joinServerRequest(
  code: string,
): Promise<JoinServerResult> {
  try {
    const { data } = await api.post<JoinServerResult>(
      `/invites/${encodeURIComponent(code)}/join`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: REQUEST_FAILED_MESSAGE,
    };
  }
}

export async function createInviteRequest(
  serverId: string,
  maxUses?: number,
): Promise<CreateInviteResult> {
  try {
    const { data } = await api.post<CreateInviteResult>(
      `/servers/${serverId}/invites`,
      maxUses !== undefined ? { maxUses } : {},
    );
    return data;
  } catch {
    return {
      ok: false,
      message: INVITE_CREATE_FAILED,
    };
  }
}

export async function listInvitationsRequest(
  serverId: string,
): Promise<ListInvitationsResult> {
  try {
    const { data } = await api.get<ListInvitationsResult>(
      `/servers/${serverId}/invites`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: INVITES_LOAD_FAILED,
    };
  }
}

export async function revokeInviteRequest(
  code: string,
): Promise<RevokeInviteResult> {
  try {
    const { data } = await api.delete<RevokeInviteResult>(
      `/invites/${encodeURIComponent(code)}`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: INVITE_REVOKE_FAILED,
    };
  }
}
