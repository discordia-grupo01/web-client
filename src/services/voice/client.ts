import {
  type LeaveVoiceResult,
  VOICE_CONNECT_FAILED,
  VOICE_LEAVE_FAILED,
  VOICE_PARTICIPANTS_FAILED,
  type VoiceParticipantsResult,
  type VoiceTokenResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

/**
 * Llamadas del navegador al BFF de voz (`/api/voice/*`). El JWT no sale del
 * servidor de Next; lo unico que llega al navegador es el token de LiveKit.
 */

export async function requestVoiceTokenRequest(
  channelId: string,
): Promise<VoiceTokenResult> {
  try {
    const { data } = await api.post<VoiceTokenResult>("/voice/token", {
      channelId,
    });
    return data;
  } catch {
    return { ok: false, message: VOICE_CONNECT_FAILED };
  }
}

export async function leaveVoiceSessionRequest(
  channelId: string,
): Promise<LeaveVoiceResult> {
  try {
    const { data } = await api.delete<LeaveVoiceResult>("/voice/session", {
      data: { channelId },
    });
    return data;
  } catch {
    return { ok: false, message: VOICE_LEAVE_FAILED };
  }
}

export async function listVoiceParticipantsRequest(
  serverId: string,
): Promise<VoiceParticipantsResult> {
  try {
    const { data } = await api.get<VoiceParticipantsResult>(
      "/voice/participants",
      { params: { serverId } },
    );
    return data;
  } catch {
    return { ok: false, message: VOICE_PARTICIPANTS_FAILED };
  }
}
