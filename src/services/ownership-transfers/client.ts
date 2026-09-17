import { api } from "@/lib/browser-api-client";

import type {
  GetPendingTransferActionResult,
  InitiateTransferActionResult,
  RespondTransferActionResult,
} from "@/types/ownership-transfer.types";

/**
 * Llamadas del navegador hacia el BFF (`/api/servers/:id/ownership-transfers`,
 * mismo origen). Nunca pega directo al gateway: el JWT nunca sale del
 * servidor de Next.
 */

export async function initiateTransferRequest(
  serverId: string,
  toUserId: string,
): Promise<InitiateTransferActionResult> {
  try {
    const { data } = await api.post<InitiateTransferActionResult>(
      `/servers/${serverId}/ownership-transfers`,
      { to_user_id: toUserId },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos iniciar la transferencia. Intenta de nuevo.",
    };
  }
}

export async function getPendingTransferRequest(
  serverId: string,
): Promise<GetPendingTransferActionResult> {
  try {
    const { data } = await api.get<GetPendingTransferActionResult>(
      `/servers/${serverId}/ownership-transfers`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos cargar la transferencia de propiedad.",
    };
  }
}

export async function acceptTransferRequest(
  serverId: string,
  transferId: string,
): Promise<RespondTransferActionResult> {
  try {
    const { data } = await api.post<RespondTransferActionResult>(
      `/servers/${serverId}/ownership-transfers/${transferId}/accept`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos aceptar la transferencia. Intenta de nuevo.",
    };
  }
}

export async function rejectTransferRequest(
  serverId: string,
  transferId: string,
): Promise<RespondTransferActionResult> {
  try {
    const { data } = await api.post<RespondTransferActionResult>(
      `/servers/${serverId}/ownership-transfers/${transferId}/reject`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos rechazar la transferencia. Intenta de nuevo.",
    };
  }
}

export async function cancelTransferRequest(
  serverId: string,
  transferId: string,
): Promise<RespondTransferActionResult> {
  try {
    const { data } = await api.post<RespondTransferActionResult>(
      `/servers/${serverId}/ownership-transfers/${transferId}/cancel`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos cancelar la transferencia. Intenta de nuevo.",
    };
  }
}
