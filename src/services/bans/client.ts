import {
  BAN_FAILED,
  BANS_LOAD_FAILED,
  type BanMemberResult,
  type ListBansResult,
  UNBAN_FAILED,
  type UnbanMemberResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

export async function listBansRequest(
  serverId: string,
): Promise<ListBansResult> {
  try {
    const { data } = await api.get<ListBansResult>(`/servers/${serverId}/bans`);
    return data;
  } catch {
    return { ok: false, message: BANS_LOAD_FAILED };
  }
}

export async function banMemberRequest(
  serverId: string,
  input: { userId: string; reason: string },
): Promise<BanMemberResult> {
  try {
    const { data } = await api.post<BanMemberResult>(
      `/servers/${serverId}/bans`,
      { user_id: input.userId, reason: input.reason },
    );
    return data;
  } catch {
    return { ok: false, message: BAN_FAILED };
  }
}

export async function unbanMemberRequest(
  serverId: string,
  userId: string,
): Promise<UnbanMemberResult> {
  try {
    const { data } = await api.delete<UnbanMemberResult>(
      `/servers/${serverId}/bans/${userId}`,
    );
    return data;
  } catch {
    return { ok: false, message: UNBAN_FAILED };
  }
}
