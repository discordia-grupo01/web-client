import {
  BANNED_WORDS_LOAD_FAILED,
  BANNED_WORDS_SAVE_FAILED,
  type ListBannedWordsResult,
  type SaveBannedWordsResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

export async function listBannedWordsRequest(
  serverId: string,
): Promise<ListBannedWordsResult> {
  try {
    const { data } = await api.get<ListBannedWordsResult>(
      `/servers/${serverId}/banned-words`,
    );
    return data;
  } catch {
    return { ok: false, message: BANNED_WORDS_LOAD_FAILED };
  }
}

export async function saveBannedWordsRequest(
  serverId: string,
  words: string[],
): Promise<SaveBannedWordsResult> {
  try {
    const { data } = await api.put<SaveBannedWordsResult>(
      `/servers/${serverId}/banned-words`,
      { words },
    );
    return data;
  } catch {
    return { ok: false, message: BANNED_WORDS_SAVE_FAILED };
  }
}
