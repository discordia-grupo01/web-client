import {
  type ListMentionsResult,
  MENTIONS_LOAD_FAILED,
  MENTIONS_MARK_READ_FAILED,
  type MessageActionResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

/** Llamadas del navegador hacia el BFF de menciones (`/api/*`, mismo origen). */

export async function listUnreadMentionsRequest(): Promise<ListMentionsResult> {
  try {
    const { data } = await api.get<ListMentionsResult>("/mentions");
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: MENTIONS_LOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: MENTIONS_LOAD_FAILED };
  }
}

export async function markChannelMentionsReadRequest(
  channelId: string,
): Promise<MessageActionResult> {
  try {
    const { data } = await api.post<MessageActionResult>(
      `/channels/${encodeURIComponent(channelId)}/mentions/read`,
    );
    return data;
  } catch {
    return { ok: false, message: MENTIONS_MARK_READ_FAILED };
  }
}
