import {
  type VoiceErrorCode,
  voiceErrorCodeOf,
  type VoiceParticipantsResponse,
  type VoiceToken,
} from "@discordia/client-shared";

import "server-only";

import { apiRequestWithBody } from "@/lib/apiClient";

/**
 * Llamadas a `voice-sfu/signaling` a traves de Kong:
 *
 *   POST   /api/voice/token                     -> 200 VoiceToken | 400 | 401 | 403 | 503
 *   DELETE /api/voice/session                   -> 204 | 400 | 401 | 403 | 503
 *   GET    /api/voice/participants?server_id=   -> 200 VoiceParticipantsResponse | 400 | 401 | 403
 *   POST   /api/voice/socket-ticket             -> 200 { ticket, expires_in } | 401 | 503
 *   POST   /api/voice/calls                     -> 201 PrivateCall | 400 | 401 | 403 | 409 | 503
 *   POST   /api/voice/calls/:id/accept          -> 200 AcceptedPrivateCall | 401 | 403 | 404 | 409
 *   POST   /api/voice/calls/:id/{reject,finish} -> 204 | 401 | 403 | 404 | 409
 *
 * Los errores llegan como `{ error: "<codigo>" }` (ver `voiceErrorCodeOf`).
 */

export type VoiceServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: VoiceErrorCode | undefined };

export interface VoiceSocketTicket {
  ticket: string;
  expires_in: number;
}

async function voiceRequest<T>(
  path: string,
  options: Parameters<typeof apiRequestWithBody>[1],
): Promise<VoiceServiceResult<T>> {
  const { result, body } = await apiRequestWithBody<T>(path, options);
  if (result.ok) return { ok: true, data: result.data };
  return { ok: false, status: result.status, code: voiceErrorCodeOf(body) };
}

export function requestVoiceToken(
  token: string,
  channelId: string,
): Promise<VoiceServiceResult<VoiceToken>> {
  return voiceRequest<VoiceToken>("/api/voice/token", {
    method: "POST",
    token,
    data: { channel_id: channelId },
  });
}

export function leaveVoiceSession(
  token: string,
  channelId: string,
): Promise<VoiceServiceResult<unknown>> {
  return voiceRequest<unknown>("/api/voice/session", {
    method: "DELETE",
    token,
    data: { channel_id: channelId },
  });
}

export function listVoiceParticipants(
  token: string,
  serverId: string,
): Promise<VoiceServiceResult<VoiceParticipantsResponse>> {
  return voiceRequest<VoiceParticipantsResponse>("/api/voice/participants", {
    method: "GET",
    token,
    params: { server_id: serverId },
  });
}

export function createVoiceSocketTicket(
  token: string,
): Promise<VoiceServiceResult<VoiceSocketTicket>> {
  return voiceRequest<VoiceSocketTicket>("/api/voice/socket-ticket", {
    method: "POST",
    token,
  });
}

export function startPrivateCall(
  token: string,
  recipientId: string,
  conversationId: string,
): Promise<VoiceServiceResult<unknown>> {
  return voiceRequest<unknown>("/api/voice/calls", {
    method: "POST",
    token,
    data: { recipient_id: recipientId, conversation_id: conversationId },
  });
}

export type PrivateCallAction = "accept" | "reject" | "finish";

export function privateCallAction(
  token: string,
  callId: string,
  action: PrivateCallAction,
): Promise<VoiceServiceResult<unknown>> {
  return voiceRequest<unknown>(
    `/api/voice/calls/${encodeURIComponent(callId)}/${action}`,
    { method: "POST", token },
  );
}
