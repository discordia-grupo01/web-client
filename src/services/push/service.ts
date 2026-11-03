import "server-only";

import type {
  PushDevice,
  PushDeviceRequest,
  PushSettings,
  VapidPublicKey,
} from "@discordia/client-shared";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

export function getPushSettings(
  token: string,
): Promise<ApiResult<PushSettings>> {
  return apiRequest<PushSettings>("/v1/notifications/push/settings", { token });
}

export function updatePushSettings(
  token: string,
  settings: PushSettings,
): Promise<ApiResult<PushSettings>> {
  return apiRequest<PushSettings>("/v1/notifications/push/settings", {
    method: "PUT",
    token,
    data: settings,
  });
}

export function getVapidPublicKey(
  token: string,
): Promise<ApiResult<VapidPublicKey>> {
  return apiRequest<VapidPublicKey>("/v1/notifications/push/vapid-public-key", {
    token,
  });
}

export function registerPushDevice(
  token: string,
  device: PushDeviceRequest,
): Promise<ApiResult<PushDevice>> {
  return apiRequest<PushDevice>("/v1/notifications/push/devices", {
    method: "POST",
    token,
    data: device,
  });
}

export function unregisterPushDevice(
  token: string,
  deviceId: string,
): Promise<ApiResult<null>> {
  return apiRequest<null>(
    `/v1/notifications/push/devices/${encodeURIComponent(deviceId)}`,
    { method: "DELETE", token },
  );
}
