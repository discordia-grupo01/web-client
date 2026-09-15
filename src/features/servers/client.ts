import { api } from "@/lib/browser-api-client";

import type {
  CreateCategoryActionResult,
  CreateChannelActionResult,
  CreateInviteActionResult,
  CreateServerActionResult,
  DeleteChannelActionResult,
  JoinServerActionResult,
  LeaveServerActionResult,
  ListInvitationsActionResult,
  ListMembersActionResult,
  MoveChannelActionResult,
  ReorderChannelsActionResult,
  RevokeInviteActionResult,
  ServerSummary,
  UpdateCategoryActionResult,
  UpdateChannelActionResult,
} from "./types";

/**
 * Llamadas del navegador hacia el BFF (`/api/servers`, mismo origen).
 * Nunca pega directo al gateway: el JWT nunca sale del servidor de Next.
 */

type ListServersResult =
  { ok: true; servers: ServerSummary[] } | { ok: false; message: string };

export async function listServersRequest(): Promise<ListServersResult> {
  try {
    const { data } = await api.get<ListServersResult>("/servers");
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos cargar tus servidores. Intenta de nuevo.",
    };
  }
}

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
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
    };
  }
}

export async function leaveServerRequest(
  serverId: string,
): Promise<LeaveServerActionResult> {
  try {
    const { data } = await api.delete<LeaveServerActionResult>(
      `/servers/${serverId}/leave`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
    };
  }
}

export async function listMembersRequest(
  serverId: string,
): Promise<ListMembersActionResult> {
  try {
    const { data } = await api.get<ListMembersActionResult>(
      `/servers/${serverId}/members`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos cargar los miembros. Intenta de nuevo.",
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
      message: "No pudimos generar la invitación. Intenta de nuevo.",
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
      message: "No pudimos cargar las invitaciones. Intenta de nuevo.",
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
      message: "No pudimos revocar el enlace. Intenta de nuevo.",
    };
  }
}

/**
 * `formData` va tal cual (multipart/form-data): le sacamos el
 * `Content-Type: application/json` que trae la instancia por default para
 * que el navegador arme solo el boundary del multipart.
 */
export async function createServerRequest(
  formData: FormData,
): Promise<CreateServerActionResult> {
  try {
    const { data } = await api.post<CreateServerActionResult>(
      "/servers",
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
    };
  }
}

export async function createChannelRequest(
  serverId: string,
  input: { name: string; kind: "text" | "voice"; categoryId?: string },
): Promise<CreateChannelActionResult> {
  try {
    const { data } = await api.post<CreateChannelActionResult>(
      `/servers/${serverId}/channels`,
      input,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos crear el canal. Intenta de nuevo.",
    };
  }
}

export async function updateChannelRequest(
  channelId: string,
  input: { name: string },
): Promise<UpdateChannelActionResult> {
  try {
    const { data } = await api.patch<UpdateChannelActionResult>(
      `/channels/${channelId}`,
      input,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos editar el canal. Intenta de nuevo.",
    };
  }
}

export async function deleteChannelRequest(
  channelId: string,
): Promise<DeleteChannelActionResult> {
  try {
    const { data } = await api.delete<DeleteChannelActionResult>(
      `/channels/${channelId}`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos eliminar el canal. Intenta de nuevo.",
    };
  }
}

/** `categoryId: null` mueve el canal a "sin categoría". */
export async function moveChannelToCategoryRequest(
  channelId: string,
  categoryId: string | null,
): Promise<MoveChannelActionResult> {
  try {
    const { data } = await api.patch<MoveChannelActionResult>(
      `/channels/${channelId}/category`,
      { categoryId },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos mover el canal. Intenta de nuevo.",
    };
  }
}

export async function createCategoryRequest(
  serverId: string,
  name: string,
): Promise<CreateCategoryActionResult> {
  try {
    const { data } = await api.post<CreateCategoryActionResult>(
      `/servers/${serverId}/categories`,
      { name },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos crear la categoría. Intenta de nuevo.",
    };
  }
}

export async function updateCategoryRequest(
  categoryId: string,
  name: string,
): Promise<UpdateCategoryActionResult> {
  try {
    const { data } = await api.patch<UpdateCategoryActionResult>(
      `/categories/${categoryId}`,
      { name },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos editar la categoría. Intenta de nuevo.",
    };
  }
}

/** `categoryId: null` reordena el balde "sin categoría". */
export async function reorderChannelsRequest(
  serverId: string,
  categoryId: string | null,
  channelIds: string[],
): Promise<ReorderChannelsActionResult> {
  try {
    const { data } = await api.patch<ReorderChannelsActionResult>(
      `/servers/${serverId}/channels/reorder`,
      { categoryId, channelIds },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos reordenar los canales. Intenta de nuevo.",
    };
  }
}
