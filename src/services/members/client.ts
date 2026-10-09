import {
  type ListMembersResult,
  MEMBERS_LOAD_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

/**
 * Llamadas del navegador hacia el BFF (`/api/servers/:id/members`, mismo
 * origen). Nunca pega directo al gateway: el JWT nunca sale del servidor de
 * Next.
 */

export async function listMembersRequest(
  serverId: string,
  offset = 0,
): Promise<ListMembersResult> {
  try {
    const { data } = await api.get<ListMembersResult>(
      `/servers/${serverId}/members`,
      { params: offset > 0 ? { offset } : undefined },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: MEMBERS_LOAD_FAILED,
    };
  }
}
