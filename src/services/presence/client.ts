import {
  type ListPresenceResult,
  PRESENCE_LOAD_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

/** Llamada del navegador hacia el BFF de estado de actividad (`/api/presence`). */
export async function listPresenceRequest(
  userIds: readonly string[],
): Promise<ListPresenceResult> {
  try {
    const { data } = await api.get<ListPresenceResult>("/presence", {
      params: { user_ids: userIds.join(",") },
    });
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: PRESENCE_LOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: PRESENCE_LOAD_FAILED };
  }
}
