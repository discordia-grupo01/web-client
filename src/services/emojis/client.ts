import {
  EMOJI_DELETE_FAILED,
  EMOJI_UPLOAD_FAILED,
  EMOJIS_LOAD_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

import type {
  DeleteServerEmojiResult,
  ListServerEmojisResult,
  UploadServerEmojiResult,
} from "./types";

export async function listServerEmojisRequest(
  serverId: string,
): Promise<ListServerEmojisResult> {
  try {
    const { data } = await api.get<ListServerEmojisResult>(
      `/servers/${serverId}/emojis`,
    );
    return data;
  } catch {
    return { ok: false, message: EMOJIS_LOAD_FAILED };
  }
}

export async function uploadServerEmojiRequest(
  serverId: string,
  formData: FormData,
): Promise<UploadServerEmojiResult> {
  try {
    const { data } = await api.post<UploadServerEmojiResult>(
      `/servers/${serverId}/emojis`,
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  } catch {
    return { ok: false, field: "form", message: EMOJI_UPLOAD_FAILED };
  }
}

export async function deleteServerEmojiRequest(
  serverId: string,
  emojiId: string,
): Promise<DeleteServerEmojiResult> {
  try {
    const { data } = await api.delete<DeleteServerEmojiResult>(
      `/servers/${serverId}/emojis/${emojiId}`,
    );
    return data;
  } catch {
    return { ok: false, message: EMOJI_DELETE_FAILED };
  }
}
