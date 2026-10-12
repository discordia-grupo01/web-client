import { KICK_FAILED, type KickMemberResult } from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

export async function kickMemberRequest(
  serverId: string,
  userId: string,
): Promise<KickMemberResult> {
  try {
    const { data } = await api.post<KickMemberResult>(
      `/servers/${serverId}/kicks`,
      { user_id: userId },
    );
    return data;
  } catch {
    return { ok: false, message: KICK_FAILED };
  }
}
