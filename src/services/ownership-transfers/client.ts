import {
  type GetPendingTransferResult,
  type InitiateTransferResult,
  type RespondTransferResult,
  TRANSFER_ACCEPT_FAILED,
  TRANSFER_CANCEL_FAILED,
  TRANSFER_LOAD_FAILED,
  TRANSFER_REJECT_FAILED,
  TRANSFER_START_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

/**
 * Llamadas del navegador hacia el BFF (`/api/servers/:id/ownership-transfers`,
 * mismo origen). Nunca pega directo al gateway: el JWT nunca sale del
 * servidor de Next.
 */

export async function initiateTransferRequest(
  serverId: string,
  toUserId: string,
): Promise<InitiateTransferResult> {
  try {
    const { data } = await api.post<InitiateTransferResult>(
      `/servers/${serverId}/ownership-transfers`,
      { to_user_id: toUserId },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: TRANSFER_START_FAILED,
    };
  }
}

export async function getPendingTransferRequest(
  serverId: string,
): Promise<GetPendingTransferResult> {
  try {
    const { data } = await api.get<GetPendingTransferResult>(
      `/servers/${serverId}/ownership-transfers`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: TRANSFER_LOAD_FAILED,
    };
  }
}

export async function acceptTransferRequest(
  serverId: string,
  transferId: string,
): Promise<RespondTransferResult> {
  try {
    const { data } = await api.post<RespondTransferResult>(
      `/servers/${serverId}/ownership-transfers/${transferId}/accept`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: TRANSFER_ACCEPT_FAILED,
    };
  }
}

export async function rejectTransferRequest(
  serverId: string,
  transferId: string,
): Promise<RespondTransferResult> {
  try {
    const { data } = await api.post<RespondTransferResult>(
      `/servers/${serverId}/ownership-transfers/${transferId}/reject`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: TRANSFER_REJECT_FAILED,
    };
  }
}

export async function cancelTransferRequest(
  serverId: string,
  transferId: string,
): Promise<RespondTransferResult> {
  try {
    const { data } = await api.post<RespondTransferResult>(
      `/servers/${serverId}/ownership-transfers/${transferId}/cancel`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: TRANSFER_CANCEL_FAILED,
    };
  }
}
