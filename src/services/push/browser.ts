import {
  PUSH_REGISTER_FAILED,
  urlBase64ToBytes,
  webPushDeviceFromSubscription,
} from "@discordia/client-shared";

import {
  getVapidKeyRequest,
  registerPushDeviceRequest,
  unregisterPushDeviceRequest,
} from "@/services/push/client";

export const SERVICE_WORKER_PATH = "/sw.js";

export type EnableThisBrowserResult =
  { ok: true } | { ok: false; message: string };

const deviceKey = (userId: string) => `discordia:push-device:${userId}`;
const wantedKey = (userId: string) => `discordia:push-wanted:${userId}`;

function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function readPushDeviceId(userId: string): string | null {
  return readItem(deviceKey(userId));
}

export function isPushWanted(userId: string): boolean {
  return readItem(wantedKey(userId)) === "1";
}

export function markPushWanted(userId: string, wanted: boolean): void {
  if (wanted) writeItem(wantedKey(userId), "1");
  else removeItem(wantedKey(userId));
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  return (
    (await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH)) ?? null
  );
}

export async function getThisBrowserSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  const registration = await getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

async function subscribeThisBrowser(
  publicKey: string,
): Promise<PushSubscription> {
  await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToBytes(publicKey).buffer as ArrayBuffer,
  });
}

export async function registerThisBrowser(
  userId: string,
): Promise<EnableThisBrowserResult> {
  try {
    const key = await getVapidKeyRequest();
    if (!key.ok) return { ok: false, message: key.message };

    const subscription = await subscribeThisBrowser(key.publicKey);
    const device = webPushDeviceFromSubscription(subscription.toJSON());
    if (!device) return { ok: false, message: PUSH_REGISTER_FAILED };

    const registered = await registerPushDeviceRequest(device);
    if (!registered.ok) return { ok: false, message: registered.message };

    writeItem(deviceKey(userId), registered.id);
    return { ok: true };
  } catch {
    return { ok: false, message: PUSH_REGISTER_FAILED };
  }
}

export async function unregisterThisBrowser(userId: string): Promise<boolean> {
  const deviceId = readPushDeviceId(userId);
  let removed = true;

  if (deviceId) {
    const result = await unregisterPushDeviceRequest(deviceId);
    if (result.ok) removeItem(deviceKey(userId));
    else removed = false;
  }

  try {
    const subscription = await getThisBrowserSubscription();
    if (subscription) await subscription.unsubscribe();
  } catch {
    removed = false;
  }

  return removed;
}

export async function unregisterOnLogout(userId: string): Promise<void> {
  try {
    await unregisterThisBrowser(userId);
  } catch {
    return;
  }
}
