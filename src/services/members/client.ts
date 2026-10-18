import {
  type ListMembersResult,
  type MemberPageQuery,
  memberPageQueryString,
  MEMBERS_LOAD_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

/**
 * Llamadas del navegador hacia el BFF (`/api/servers/:id/members`, mismo
 * origen). Nunca pega directo al gateway: el JWT nunca sale del servidor de
 * Next.
 */

/** Sin `limit` el BFF pide 100, el maximo del back. */
export async function listMembersRequest(
  serverId: string,
  query: MemberPageQuery = {},
): Promise<ListMembersResult> {
  try {
    const { data } = await api.get<ListMembersResult>(
      `/servers/${serverId}/members${memberPageQueryString(query)}`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: MEMBERS_LOAD_FAILED,
    };
  }
}
