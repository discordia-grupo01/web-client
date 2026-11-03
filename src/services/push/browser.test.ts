import { PUSH_REGISTER_FAILED } from "@discordia/client-shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getVapidKeyRequest = vi.fn();
const registerPushDeviceRequest = vi.fn();
const unregisterPushDeviceRequest = vi.fn();

vi.mock("@/services/push/client", () => ({
  getVapidKeyRequest: (...args: unknown[]) => getVapidKeyRequest(...args),
  registerPushDeviceRequest: (...args: unknown[]) =>
    registerPushDeviceRequest(...args),
  unregisterPushDeviceRequest: (...args: unknown[]) =>
    unregisterPushDeviceRequest(...args),
}));

import {
  getThisBrowserSubscription,
  isPushWanted,
  isWebPushSupported,
  markPushWanted,
  readPushDeviceId,
  registerThisBrowser,
  SERVICE_WORKER_PATH,
  unregisterOnLogout,
  unregisterThisBrowser,
} from "@/services/push/browser";

const subscriptionJson = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "BKey", auth: "secret" },
};

function makeSubscription() {
  return {
    toJSON: () => subscriptionJson,
    unsubscribe: vi.fn(() => Promise.resolve(true)),
  };
}

function installBrowser(
  existing: ReturnType<typeof makeSubscription> | null = null,
) {
  const created = makeSubscription();
  const pushManager = {
    getSubscription: vi.fn(() => Promise.resolve(existing)),
    subscribe: vi.fn((_options: unknown) => Promise.resolve(created)),
  };
  const registration = { pushManager };
  const serviceWorker = {
    register: vi.fn(() => Promise.resolve(registration)),
    ready: Promise.resolve(registration),
    getRegistration: vi.fn(() => Promise.resolve(registration)),
  };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: serviceWorker,
  });
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", { permission: "default" });
  return { serviceWorker, pushManager, created };
}

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  };
}

function removeBrowser() {
  Reflect.deleteProperty(navigator, "serviceWorker");
  vi.unstubAllGlobals();
}

describe("push en el navegador", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", memoryStorage());
  });

  afterEach(() => {
    removeBrowser();
  });

  describe("isWebPushSupported", () => {
    it("es falso si falta alguna de las piezas", () => {
      expect(isWebPushSupported()).toBe(false);
    });

    it("es verdadero con service worker, PushManager y Notification", () => {
      installBrowser();
      expect(isWebPushSupported()).toBe(true);
    });
  });

  describe("lo que recuerda este navegador", () => {
    it("no sabe nada de un usuario que nunca activo el push", () => {
      expect(readPushDeviceId("u1")).toBeNull();
      expect(isPushWanted("u1")).toBe(false);
    });

    it("recuerda que el usuario lo quiere, por usuario", () => {
      markPushWanted("u1", true);

      expect(isPushWanted("u1")).toBe(true);
      expect(isPushWanted("u2")).toBe(false);

      markPushWanted("u1", false);
      expect(isPushWanted("u1")).toBe(false);
    });

    it("sin storage no falla", () => {
      const blocked = () => {
        throw new Error("bloqueado");
      };
      vi.stubGlobal("localStorage", {
        getItem: blocked,
        setItem: blocked,
        removeItem: blocked,
      });

      expect(readPushDeviceId("u1")).toBeNull();
      expect(isPushWanted("u1")).toBe(false);
      expect(() => markPushWanted("u1", true)).not.toThrow();
      expect(() => markPushWanted("u1", false)).not.toThrow();
    });
  });

  describe("getThisBrowserSubscription", () => {
    it("es null si el navegador no soporta push", async () => {
      expect(await getThisBrowserSubscription()).toBeNull();
    });

    it("devuelve la suscripcion existente", async () => {
      const existing = makeSubscription();
      installBrowser(existing);

      expect(await getThisBrowserSubscription()).toBe(existing);
    });

    it("es null si todavia no hay service worker registrado", async () => {
      const { serviceWorker } = installBrowser();
      serviceWorker.getRegistration.mockResolvedValue(undefined as never);

      expect(await getThisBrowserSubscription()).toBeNull();
    });
  });

  describe("registerThisBrowser", () => {
    it("se suscribe con la clave del servidor y registra el dispositivo", async () => {
      const { serviceWorker, pushManager } = installBrowser();
      getVapidKeyRequest.mockResolvedValue({ ok: true, publicKey: "AQID" });
      registerPushDeviceRequest.mockResolvedValue({ ok: true, id: "dev1" });

      const result = await registerThisBrowser("u1");

      expect(result).toEqual({ ok: true });
      expect(serviceWorker.register).toHaveBeenCalledWith(SERVICE_WORKER_PATH);
      const options = pushManager.subscribe.mock.calls[0][0] as {
        userVisibleOnly: boolean;
        applicationServerKey: ArrayBuffer;
      };
      expect(options.userVisibleOnly).toBe(true);
      expect(Array.from(new Uint8Array(options.applicationServerKey))).toEqual([
        1, 2, 3,
      ]);
      expect(registerPushDeviceRequest).toHaveBeenCalledWith({
        provider: "webpush",
        platform: "web",
        endpoint: subscriptionJson.endpoint,
        p256dh: "BKey",
        auth: "secret",
      });
      expect(readPushDeviceId("u1")).toBe("dev1");
    });

    it("reutiliza la suscripcion que ya tenia el navegador", async () => {
      const existing = makeSubscription();
      const { pushManager } = installBrowser(existing);
      getVapidKeyRequest.mockResolvedValue({ ok: true, publicKey: "AQID" });
      registerPushDeviceRequest.mockResolvedValue({ ok: true, id: "dev1" });

      await registerThisBrowser("u1");

      expect(pushManager.subscribe).not.toHaveBeenCalled();
    });

    it("si no hay clave del servidor devuelve su mensaje y no se suscribe", async () => {
      const { pushManager } = installBrowser();
      getVapidKeyRequest.mockResolvedValue({
        ok: false,
        message: "No disponible",
      });

      expect(await registerThisBrowser("u1")).toEqual({
        ok: false,
        message: "No disponible",
      });
      expect(pushManager.subscribe).not.toHaveBeenCalled();
    });

    it("si el back rechaza el dispositivo devuelve su mensaje y no guarda el id", async () => {
      installBrowser();
      getVapidKeyRequest.mockResolvedValue({ ok: true, publicKey: "AQID" });
      registerPushDeviceRequest.mockResolvedValue({
        ok: false,
        message: "Limite alcanzado",
        limitReached: true,
      });

      expect(await registerThisBrowser("u1")).toEqual({
        ok: false,
        message: "Limite alcanzado",
      });
      expect(readPushDeviceId("u1")).toBeNull();
    });

    it("si la suscripcion no tiene las claves no registra nada", async () => {
      const { pushManager } = installBrowser();
      pushManager.subscribe.mockResolvedValue({
        toJSON: () => ({ endpoint: "https://x.example.com/abc" }),
        unsubscribe: vi.fn(),
      } as never);
      getVapidKeyRequest.mockResolvedValue({ ok: true, publicKey: "AQID" });

      expect(await registerThisBrowser("u1")).toEqual({
        ok: false,
        message: PUSH_REGISTER_FAILED,
      });
      expect(registerPushDeviceRequest).not.toHaveBeenCalled();
    });

    it("si el navegador falla al suscribirse devuelve un error generico", async () => {
      const { pushManager } = installBrowser();
      pushManager.subscribe.mockRejectedValue(new Error("push service error"));
      getVapidKeyRequest.mockResolvedValue({ ok: true, publicKey: "AQID" });

      expect(await registerThisBrowser("u1")).toEqual({
        ok: false,
        message: PUSH_REGISTER_FAILED,
      });
    });

    it("una clave invalida del servidor no rompe: devuelve el error generico", async () => {
      installBrowser();
      getVapidKeyRequest.mockResolvedValue({
        ok: true,
        publicKey: "no*valida",
      });

      expect(await registerThisBrowser("u1")).toEqual({
        ok: false,
        message: PUSH_REGISTER_FAILED,
      });
    });
  });

  describe("unregisterThisBrowser", () => {
    it("borra el dispositivo del back, su id y la suscripcion", async () => {
      const existing = makeSubscription();
      installBrowser(existing);
      localStorage.setItem("discordia:push-device:u1", "dev1");
      unregisterPushDeviceRequest.mockResolvedValue({ ok: true });

      expect(await unregisterThisBrowser("u1")).toBe(true);

      expect(unregisterPushDeviceRequest).toHaveBeenCalledWith("dev1");
      expect(readPushDeviceId("u1")).toBeNull();
      expect(existing.unsubscribe).toHaveBeenCalled();
    });

    it("si el back falla conserva el id para poder reintentar", async () => {
      installBrowser(makeSubscription());
      localStorage.setItem("discordia:push-device:u1", "dev1");
      unregisterPushDeviceRequest.mockResolvedValue({
        ok: false,
        message: "x",
      });

      expect(await unregisterThisBrowser("u1")).toBe(false);
      expect(readPushDeviceId("u1")).toBe("dev1");
    });

    it("sin dispositivo registrado solo se desuscribe", async () => {
      const existing = makeSubscription();
      installBrowser(existing);

      expect(await unregisterThisBrowser("u1")).toBe(true);

      expect(unregisterPushDeviceRequest).not.toHaveBeenCalled();
      expect(existing.unsubscribe).toHaveBeenCalled();
    });

    it("si no puede desuscribirse lo informa", async () => {
      const existing = makeSubscription();
      existing.unsubscribe.mockRejectedValue(new Error("x"));
      installBrowser(existing);

      expect(await unregisterThisBrowser("u1")).toBe(false);
    });
  });

  describe("unregisterOnLogout", () => {
    it("nunca falla, aunque algo salga mal", async () => {
      installBrowser(makeSubscription());
      localStorage.setItem("discordia:push-device:u1", "dev1");
      unregisterPushDeviceRequest.mockRejectedValue(new Error("sin red"));

      await expect(unregisterOnLogout("u1")).resolves.toBeUndefined();
    });
  });
});
