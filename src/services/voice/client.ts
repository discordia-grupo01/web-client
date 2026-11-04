import {
  type AcceptPrivateCallResult,
  type LeaveVoiceResult,
  PRIVATE_CALL_ACCEPT_FAILED,
  PRIVATE_CALL_END_FAILED,
  PRIVATE_CALL_START_FAILED,
  type PrivateCallActionResult,
  type StartPrivateCallResult,
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

export async function fetchVoiceSocketTicketRequest(): Promise<
  { ok: true; ticket: string } | { ok: false; sessionExpired: boolean }
> {
  try {
    const { data, status } = await api.post<{
      ticket?: string;
      expires_in?: number;
    }>("/voice/socket-ticket");
    if (status === 200 && typeof data?.ticket === "string") {
      return { ok: true, ticket: data.ticket };
    }
    return { ok: false, sessionExpired: status === 401 };
  } catch {
    return { ok: false, sessionExpired: false };
  }
}

export async function startPrivateCallRequest(
  recipientId: string,
  conversationId: string,
): Promise<StartPrivateCallResult> {
  try {
    const { data } = await api.post<StartPrivateCallResult>("/voice/calls", {
      recipientId,
      conversationId,
    });
    return data;
  } catch {
    return { ok: false, message: PRIVATE_CALL_START_FAILED };
  }
}

export async function acceptPrivateCallRequest(
  callId: string,
): Promise<AcceptPrivateCallResult> {
  try {
    const { data } = await api.post<AcceptPrivateCallResult>(
      privateCallPath(callId, "accept"),
    );
    return data;
  } catch {
    return { ok: false, message: PRIVATE_CALL_ACCEPT_FAILED };
  }
}

/** Quien recibe la rechaza; quien llama la cancela. */
export async function rejectPrivateCallRequest(
  callId: string,
): Promise<PrivateCallActionResult> {
  return endPrivateCall(callId, "reject");
}

export async function finishPrivateCallRequest(
  callId: string,
): Promise<PrivateCallActionResult> {
  return endPrivateCall(callId, "finish");
}

export function sendPrivateCallBeacon(
  callId: string,
  action: "reject" | "finish",
): void {
  navigator.sendBeacon(`/api${privateCallPath(callId, action)}`);
}

function privateCallPath(callId: string, action: string): string {
  return `/voice/calls/${encodeURIComponent(callId)}/${action}`;
}

async function endPrivateCall(
  callId: string,
  action: "reject" | "finish",
): Promise<PrivateCallActionResult> {
  try {
    const { data } = await api.post<PrivateCallActionResult>(
      privateCallPath(callId, action),
    );
    return data;
  } catch {
    return { ok: false, message: PRIVATE_CALL_END_FAILED };
  }
}
