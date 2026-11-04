import {
  PLATFORM_STATUS_LOAD_FAILED,
  type PlatformStatusResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

export async function getPlatformStatusRequest(): Promise<PlatformStatusResult> {
  try {
    const { data } = await api.get<PlatformStatusResult>("/platform-status");
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: PLATFORM_STATUS_LOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: PLATFORM_STATUS_LOAD_FAILED };
  }
}
