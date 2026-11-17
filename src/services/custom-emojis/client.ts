import { CUSTOM_EMOJIS_LOAD_FAILED } from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

import type { ListCustomEmojisResult } from "./types";

export async function listCustomEmojisRequest(
  ids: readonly string[],
): Promise<ListCustomEmojisResult> {
  try {
    const { data } = await api.get<ListCustomEmojisResult>(
      `/custom-emojis?ids=${encodeURIComponent(ids.join(","))}`,
    );
    return data;
  } catch {
    return { ok: false, message: CUSTOM_EMOJIS_LOAD_FAILED };
  }
}
