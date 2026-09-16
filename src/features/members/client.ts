import { api } from "@/lib/browser-api-client";

import type { ListMembersActionResult } from "./types";

/**
 * Llamadas del navegador hacia el BFF (`/api/servers/:id/members`, mismo
 * origen). Nunca pega directo al gateway: el JWT nunca sale del servidor de
 * Next.
 */

export async function listMembersRequest(
  serverId: string,
): Promise<ListMembersActionResult> {
  try {
    const { data } = await api.get<ListMembersActionResult>(
      `/servers/${serverId}/members`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos cargar los miembros. Intenta de nuevo.",
    };
  }
}
