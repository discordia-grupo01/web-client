import {
  CHANNEL_PERMISSIONS_LOAD_FAILED,
  CHANNEL_PERMISSIONS_SAVE_FAILED,
  type ChannelOverridePermission,
  type DeleteChannelOverrideResult,
  type ListChannelOverridesResult,
  MEMBER_PERMISSIONS_LOAD_FAILED,
  type MemberPermissionsResult,
  type SetChannelOverrideResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

export async function listChannelOverridesRequest(
  channelId: string,
): Promise<ListChannelOverridesResult> {
  try {
    const { data } = await api.get<ListChannelOverridesResult>(
      `/channels/${channelId}/permissions`,
    );
    return data;
  } catch {
    return { ok: false, message: CHANNEL_PERMISSIONS_LOAD_FAILED };
  }
}

export async function setChannelOverrideRequest(
  channelId: string,
  input: {
    roleId: string;
    allow: ChannelOverridePermission[];
    deny: ChannelOverridePermission[];
  },
): Promise<SetChannelOverrideResult> {
  try {
    const { data } = await api.put<SetChannelOverrideResult>(
      `/channels/${channelId}/permissions`,
      input,
    );
    return data;
  } catch {
    return { ok: false, message: CHANNEL_PERMISSIONS_SAVE_FAILED };
  }
}

export async function deleteChannelOverrideRequest(
  channelId: string,
  roleId: string,
): Promise<DeleteChannelOverrideResult> {
  try {
    const { data } = await api.delete<DeleteChannelOverrideResult>(
      `/channels/${channelId}/permissions`,
      { data: { roleId } },
    );
    return data;
  } catch {
    return { ok: false, message: CHANNEL_PERMISSIONS_SAVE_FAILED };
  }
}

/** Los permisos del usuario actual en el canal, con las excepciones aplicadas. */
export async function getMyChannelPermissionsRequest(
  channelId: string,
): Promise<MemberPermissionsResult> {
  try {
    const { data } = await api.get<MemberPermissionsResult>(
      `/channels/${channelId}/my-permissions`,
    );
    return data;
  } catch {
    return { ok: false, message: MEMBER_PERMISSIONS_LOAD_FAILED };
  }
}
