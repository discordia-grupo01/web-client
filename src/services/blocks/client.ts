import {
  BLOCKS_LOAD_FAILED,
  type BlockUserResult,
  type ListBlocksResult,
  USER_BLOCK_FAILED,
  USER_UNBLOCK_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

export async function listBlocksRequest(): Promise<ListBlocksResult> {
  try {
    const { data } = await api.get<ListBlocksResult>("/blocks");
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: BLOCKS_LOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: BLOCKS_LOAD_FAILED };
  }
}

export async function blockUserRequest(
  userId: string,
): Promise<BlockUserResult> {
  try {
    const { data } = await api.post<BlockUserResult>("/blocks", { userId });
    return data;
  } catch {
    return { ok: false, message: USER_BLOCK_FAILED };
  }
}

export async function unblockUserRequest(
  userId: string,
): Promise<BlockUserResult> {
  try {
    const { data } = await api.delete<BlockUserResult>(
      `/blocks/${encodeURIComponent(userId)}`,
    );
    return data;
  } catch {
    return { ok: false, message: USER_UNBLOCK_FAILED };
  }
}
