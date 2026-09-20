import {
  INVITE_CREATE_FAILED,
  INVITE_REVOKE_FAILED,
  INVITES_LOAD_FAILED,
  REQUEST_FAILED_MESSAGE,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

import type {
  CreateInviteActionResult,
  JoinServerActionResult,
  ListInvitationsActionResult,
  RevokeInviteActionResult,
} from "@/types/invite.types";

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
): Promise<JoinServerActionResult> {
  try {
    const { data } = await api.post<JoinServerActionResult>(
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
): Promise<CreateInviteActionResult> {
  try {
    const { data } = await api.post<CreateInviteActionResult>(
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
): Promise<ListInvitationsActionResult> {
  try {
    const { data } = await api.get<ListInvitationsActionResult>(
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
): Promise<RevokeInviteActionResult> {
  try {
    const { data } = await api.delete<RevokeInviteActionResult>(
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
