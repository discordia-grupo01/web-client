import {
  KICK_FAILED,
  type KickMemberResult,
  MUTE_FAILED,
  type MuteMemberResult,
  UNMUTE_FAILED,
  type UnmuteMemberResult,
} from "@discordia/client-shared";

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

export async function muteMemberRequest(
  serverId: string,
  input: { userId: string; untilAt: string; reason: string },
): Promise<MuteMemberResult> {
  try {
    const { data } = await api.post<MuteMemberResult>(
      `/servers/${serverId}/mutes`,
      { user_id: input.userId, until_at: input.untilAt, reason: input.reason },
    );
    return data;
  } catch {
    return { ok: false, message: MUTE_FAILED };
  }
}

export async function unmuteMemberRequest(
  serverId: string,
  userId: string,
): Promise<UnmuteMemberResult> {
  try {
    const { data } = await api.delete<UnmuteMemberResult>(
      `/servers/${serverId}/mutes/${userId}`,
    );
    return data;
  } catch {
    return { ok: false, message: UNMUTE_FAILED };
  }
}
