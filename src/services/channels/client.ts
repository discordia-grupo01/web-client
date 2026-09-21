import {
  CHANNEL_CREATE_FAILED,
  CHANNEL_DELETE_FAILED,
  CHANNEL_MOVE_FAILED,
  CHANNEL_REORDER_FAILED,
  CHANNEL_UPDATE_FAILED,
  type CreateChannelResult,
  type DeleteChannelResult,
  type MoveChannelResult,
  type ReorderChannelsResult,
  type UpdateChannelResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

/**
 * Llamadas del navegador hacia el BFF (`/api/channels`, `/api/servers/:id/channels`,
 * mismo origen). Nunca pega directo al gateway: el JWT nunca sale del
 * servidor de Next.
 */

export async function createChannelRequest(
  serverId: string,
  input: { name: string; kind: "text" | "voice"; categoryId?: string },
): Promise<CreateChannelResult> {
  try {
    const { data } = await api.post<CreateChannelResult>(
      `/servers/${serverId}/channels`,
      input,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: CHANNEL_CREATE_FAILED,
    };
  }
}

export async function updateChannelRequest(
  channelId: string,
  input: { name: string },
): Promise<UpdateChannelResult> {
  try {
    const { data } = await api.patch<UpdateChannelResult>(
      `/channels/${channelId}`,
      input,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: CHANNEL_UPDATE_FAILED,
    };
  }
}

export async function deleteChannelRequest(
  channelId: string,
): Promise<DeleteChannelResult> {
  try {
    const { data } = await api.delete<DeleteChannelResult>(
      `/channels/${channelId}`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: CHANNEL_DELETE_FAILED,
    };
  }
}

/** `categoryId: null` mueve el canal a "sin categoría". */
export async function moveChannelToCategoryRequest(
  channelId: string,
  categoryId: string | null,
): Promise<MoveChannelResult> {
  try {
    const { data } = await api.patch<MoveChannelResult>(
      `/channels/${channelId}/category`,
      { categoryId },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: CHANNEL_MOVE_FAILED,
    };
  }
}

/** `categoryId: null` reordena el balde "sin categoría". */
export async function reorderChannelsRequest(
  serverId: string,
  categoryId: string | null,
  channelIds: string[],
): Promise<ReorderChannelsResult> {
  try {
    const { data } = await api.patch<ReorderChannelsResult>(
      `/servers/${serverId}/channels/reorder`,
      { categoryId, channelIds },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: CHANNEL_REORDER_FAILED,
    };
  }
}
