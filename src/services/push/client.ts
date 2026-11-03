import {
  type LoadPushSettingsResult,
  type LoadVapidKeyResult,
  PUSH_NOT_AVAILABLE,
  PUSH_REGISTER_FAILED,
  PUSH_SETTINGS_LOAD_FAILED,
  PUSH_SETTINGS_SAVE_FAILED,
  PUSH_UNREGISTER_FAILED,
  type PushDeviceRequest,
  type RegisterPushDeviceResult,
  type SavePushSettingsResult,
  type UnregisterPushDeviceResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

const hasOk = (data: unknown): data is { ok: boolean } =>
  typeof (data as { ok?: unknown } | null)?.ok === "boolean";

export async function getPushSettingsRequest(): Promise<LoadPushSettingsResult> {
  try {
    const { data } = await api.get<LoadPushSettingsResult>(
      "/notifications/push/settings",
    );
    return hasOk(data)
      ? data
      : { ok: false, message: PUSH_SETTINGS_LOAD_FAILED };
  } catch {
    return { ok: false, message: PUSH_SETTINGS_LOAD_FAILED };
  }
}

export async function updatePushSettingsRequest(
  enabled: boolean,
): Promise<SavePushSettingsResult> {
  try {
    const { data } = await api.put<SavePushSettingsResult>(
      "/notifications/push/settings",
      { enabled },
    );
    return hasOk(data)
      ? data
      : { ok: false, message: PUSH_SETTINGS_SAVE_FAILED };
  } catch {
    return { ok: false, message: PUSH_SETTINGS_SAVE_FAILED };
  }
}

export async function getVapidKeyRequest(): Promise<LoadVapidKeyResult> {
  try {
    const { data } = await api.get<LoadVapidKeyResult>(
      "/notifications/push/vapid-public-key",
    );
    return hasOk(data) ? data : { ok: false, message: PUSH_NOT_AVAILABLE };
  } catch {
    return { ok: false, message: PUSH_NOT_AVAILABLE };
  }
}

export async function registerPushDeviceRequest(
  device: PushDeviceRequest,
): Promise<RegisterPushDeviceResult> {
  try {
    const { data } = await api.post<RegisterPushDeviceResult>(
      "/notifications/push/devices",
      device,
    );
    return hasOk(data) ? data : { ok: false, message: PUSH_REGISTER_FAILED };
  } catch {
    return { ok: false, message: PUSH_REGISTER_FAILED };
  }
}

export async function unregisterPushDeviceRequest(
  deviceId: string,
): Promise<UnregisterPushDeviceResult> {
  try {
    const { data } = await api.delete<UnregisterPushDeviceResult>(
      `/notifications/push/devices/${encodeURIComponent(deviceId)}`,
    );
    return hasOk(data) ? data : { ok: false, message: PUSH_UNREGISTER_FAILED };
  } catch {
    return { ok: false, message: PUSH_UNREGISTER_FAILED };
  }
}
