import {
  CHANNEL_CREATE_FAILED,
  CHANNEL_DELETE_FAILED,
  CHANNEL_MOVE_FAILED,
  CHANNEL_REORDER_FAILED,
  CHANNEL_UPDATE_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

import type {
  CreateChannelActionResult,
  DeleteChannelActionResult,
  MoveChannelActionResult,
  ReorderChannelsActionResult,
  UpdateChannelActionResult,
} from "@/types/channel.types";

/**
 * Llamadas del navegador hacia el BFF (`/api/channels`, `/api/servers/:id/channels`,
 * mismo origen). Nunca pega directo al gateway: el JWT nunca sale del
 * servidor de Next.
 */

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
      message: CHANNEL_CREATE_FAILED,
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
      message: CHANNEL_UPDATE_FAILED,
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
      message: CHANNEL_DELETE_FAILED,
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
      message: CHANNEL_MOVE_FAILED,
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
      message: CHANNEL_REORDER_FAILED,
    };
  }
}
