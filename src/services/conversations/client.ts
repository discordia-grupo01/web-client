import {
  DM_CONVERSATIONS_LOAD_FAILED,
  DM_MARK_READ_FAILED,
  type ListConversationsResult,
  type MessageActionResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

/** Llamadas del navegador hacia el BFF de DMs (`/api/*`, mismo origen). */

export async function listConversationsRequest(): Promise<ListConversationsResult> {
  try {
    const { data } = await api.get<ListConversationsResult>("/conversations");
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: DM_CONVERSATIONS_LOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: DM_CONVERSATIONS_LOAD_FAILED };
  }
}

export async function markConversationReadRequest(
  conversationId: string,
): Promise<MessageActionResult> {
  try {
    const { data } = await api.post<MessageActionResult>(
      `/conversations/${encodeURIComponent(conversationId)}/read`,
    );
    return data;
  } catch {
    return { ok: false, message: DM_MARK_READ_FAILED };
  }
}
