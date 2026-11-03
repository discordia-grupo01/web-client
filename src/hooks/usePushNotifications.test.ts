import {
  PUSH_SETTINGS_SAVE_FAILED,
  PUSH_UNREGISTER_FAILED,
} from "@discordia/client-shared";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isWebPushSupported = vi.fn();
const getThisBrowserSubscription = vi.fn();
const readPushDeviceId = vi.fn();
const isPushWanted = vi.fn();
const markPushWanted = vi.fn();
const registerThisBrowser = vi.fn();
const unregisterThisBrowser = vi.fn();

vi.mock("@/services/push/browser", () => ({
  isWebPushSupported: () => isWebPushSupported(),
  getThisBrowserSubscription: () => getThisBrowserSubscription(),
  readPushDeviceId: (...args: unknown[]) => readPushDeviceId(...args),
  isPushWanted: (...args: unknown[]) => isPushWanted(...args),
  markPushWanted: (...args: unknown[]) => markPushWanted(...args),
  registerThisBrowser: (...args: unknown[]) => registerThisBrowser(...args),
  unregisterThisBrowser: (...args: unknown[]) => unregisterThisBrowser(...args),
}));

const getPushSettingsRequest = vi.fn();
const updatePushSettingsRequest = vi.fn();

vi.mock("@/services/push/client", () => ({
  getPushSettingsRequest: () => getPushSettingsRequest(),
  updatePushSettingsRequest: (...args: unknown[]) =>
    updatePushSettingsRequest(...args),
}));

import {
  usePushDeviceSync,
  usePushNotifications,
} from "@/hooks/usePushNotifications";

function stubNotification(
  permission: NotificationPermission,
  requested?: NotificationPermission,
) {
  vi.stubGlobal("Notification", {
    permission,
    requestPermission: vi.fn(() => Promise.resolve(requested ?? permission)),
  });
}

async function renderLoaded(userId: string | null = "u1") {
  const hook = renderHook(() => usePushNotifications(userId));
  await waitFor(() =>
    expect(hook.result.current.browserStatus).not.toBe("loading"),
  );
  await waitFor(() =>
    expect(hook.result.current.accountEnabled).not.toBeNull(),
  );
  return hook;
}

describe("usePushNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isWebPushSupported.mockReturnValue(true);
    getThisBrowserSubscription.mockResolvedValue(null);
    readPushDeviceId.mockReturnValue(null);
    getPushSettingsRequest.mockResolvedValue({ ok: true, enabled: true });
    stubNotification("default");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("al montar", () => {
    it("carga el interruptor de la cuenta y el estado del navegador", async () => {
      getPushSettingsRequest.mockResolvedValue({ ok: true, enabled: false });

      const { result } = await renderLoaded();

      expect(result.current.accountEnabled).toBe(false);
      expect(result.current.browserStatus).toBe("off");
    });

    it("mientras carga el interruptor es desconocido", () => {
      getPushSettingsRequest.mockReturnValue(new Promise(() => undefined));

      const { result } = renderHook(() => usePushNotifications("u1"));

      expect(result.current.accountEnabled).toBeNull();
      expect(result.current.browserStatus).toBe("loading");
    });

    it("avisa si el navegador no soporta push", async () => {
      isWebPushSupported.mockReturnValue(false);

      const { result } = await renderLoaded();

      expect(result.current.browserStatus).toBe("unsupported");
    });

    it("avisa si el usuario bloqueo las notificaciones", async () => {
      stubNotification("denied");

      const { result } = await renderLoaded();

      expect(result.current.browserStatus).toBe("denied");
    });

    it("esta activo si hay suscripcion y dispositivo registrado", async () => {
      stubNotification("granted");
      getThisBrowserSubscription.mockResolvedValue({});
      readPushDeviceId.mockReturnValue("dev1");

      const { result } = await renderLoaded();

      expect(result.current.browserStatus).toBe("on");
    });

    it("no esta activo si falta el dispositivo registrado", async () => {
      stubNotification("granted");
      getThisBrowserSubscription.mockResolvedValue({});

      const { result } = await renderLoaded();

      expect(result.current.browserStatus).toBe("off");
    });

    it("muestra el error si no pudo cargar el interruptor", async () => {
      getPushSettingsRequest.mockResolvedValue({
        ok: false,
        message: "No pudimos cargar",
      });

      const { result } = renderHook(() => usePushNotifications("u1"));

      await waitFor(() =>
        expect(result.current.error).toBe("No pudimos cargar"),
      );
    });
  });

  describe("interruptor de la cuenta", () => {
    it("lo cambia al instante y se queda con lo que responde el back", async () => {
      updatePushSettingsRequest.mockResolvedValue({ ok: true, enabled: false });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.setAccountEnabled(false);
      });

      expect(updatePushSettingsRequest).toHaveBeenCalledWith(false);
      expect(result.current.accountEnabled).toBe(false);
    });

    it("muestra el cambio antes de que responda el back", async () => {
      let resolve: (value: unknown) => void = () => undefined;
      updatePushSettingsRequest.mockReturnValue(
        new Promise((done) => (resolve = done)),
      );
      const { result } = await renderLoaded();

      act(() => {
        void result.current.setAccountEnabled(false);
      });

      expect(result.current.accountEnabled).toBe(false);
      await act(async () => resolve({ ok: true, enabled: false }));
    });

    it("lo deshace y muestra el error si el back falla", async () => {
      updatePushSettingsRequest.mockResolvedValue({
        ok: false,
        message: "Falló",
      });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.setAccountEnabled(false);
      });

      expect(result.current.accountEnabled).toBe(true);
      expect(result.current.error).toBe("Falló");
    });

    it("usa el mensaje de siempre si el back no manda uno", async () => {
      updatePushSettingsRequest.mockResolvedValue({ ok: false, message: "" });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.setAccountEnabled(false);
      });

      expect(result.current.error).toBe(PUSH_SETTINGS_SAVE_FAILED);
    });
  });

  describe("activar este navegador", () => {
    it("pide permiso, registra el dispositivo y queda activo", async () => {
      stubNotification("default", "granted");
      registerThisBrowser.mockResolvedValue({ ok: true });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.enableBrowser();
      });

      expect(registerThisBrowser).toHaveBeenCalledWith("u1");
      expect(markPushWanted).toHaveBeenCalledWith("u1", true);
      expect(result.current.browserStatus).toBe("on");
      expect(result.current.isBusy).toBe(false);
    });

    it("si el permiso ya estaba dado no lo vuelve a pedir", async () => {
      stubNotification("granted");
      registerThisBrowser.mockResolvedValue({ ok: true });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.enableBrowser();
      });

      expect(Notification.requestPermission).not.toHaveBeenCalled();
      expect(result.current.browserStatus).toBe("on");
    });

    it("si el usuario deniega el permiso queda bloqueado y no registra nada", async () => {
      stubNotification("default", "denied");
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.enableBrowser();
      });

      expect(registerThisBrowser).not.toHaveBeenCalled();
      expect(result.current.browserStatus).toBe("denied");
    });

    it("si cierra el pedido de permiso sin elegir sigue apagado", async () => {
      stubNotification("default", "default");
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.enableBrowser();
      });

      expect(registerThisBrowser).not.toHaveBeenCalled();
      expect(result.current.browserStatus).toBe("off");
    });

    it("muestra el error si no se pudo registrar y sigue apagado", async () => {
      stubNotification("granted");
      registerThisBrowser.mockResolvedValue({
        ok: false,
        message: "Limite alcanzado",
      });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.enableBrowser();
      });

      expect(result.current.error).toBe("Limite alcanzado");
      expect(result.current.browserStatus).toBe("off");
      expect(markPushWanted).not.toHaveBeenCalled();
    });

    it("sin usuario no hace nada", async () => {
      const { result } = await renderLoaded(null);

      await act(async () => {
        await result.current.enableBrowser();
      });

      expect(registerThisBrowser).not.toHaveBeenCalled();
    });
  });

  describe("desactivar este navegador", () => {
    async function renderActive() {
      stubNotification("granted");
      getThisBrowserSubscription.mockResolvedValue({});
      readPushDeviceId.mockReturnValue("dev1");
      return renderLoaded();
    }

    it("borra el dispositivo y deja de querer el push", async () => {
      unregisterThisBrowser.mockResolvedValue(true);
      const { result } = await renderActive();
      expect(result.current.browserStatus).toBe("on");

      await act(async () => {
        await result.current.disableBrowser();
      });

      expect(unregisterThisBrowser).toHaveBeenCalledWith("u1");
      expect(markPushWanted).toHaveBeenCalledWith("u1", false);
      expect(result.current.browserStatus).toBe("off");
    });

    it("si no pudo borrarlo sigue activo y avisa", async () => {
      unregisterThisBrowser.mockResolvedValue(false);
      const { result } = await renderActive();

      await act(async () => {
        await result.current.disableBrowser();
      });

      expect(result.current.browserStatus).toBe("on");
      expect(result.current.error).toBe(PUSH_UNREGISTER_FAILED);
      expect(markPushWanted).not.toHaveBeenCalled();
    });
  });
});

describe("usePushDeviceSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isWebPushSupported.mockReturnValue(true);
    isPushWanted.mockReturnValue(true);
    readPushDeviceId.mockReturnValue(null);
    registerThisBrowser.mockResolvedValue({ ok: true });
    stubNotification("granted");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("vuelve a registrar el navegador si el usuario lo queria y ya tiene permiso", () => {
    renderHook(() => usePushDeviceSync("u1"));

    expect(registerThisBrowser).toHaveBeenCalledWith("u1");
  });

  it("no hace nada sin usuario", () => {
    renderHook(() => usePushDeviceSync(null));

    expect(registerThisBrowser).not.toHaveBeenCalled();
  });

  it("no hace nada si el navegador no soporta push", () => {
    isWebPushSupported.mockReturnValue(false);

    renderHook(() => usePushDeviceSync("u1"));

    expect(registerThisBrowser).not.toHaveBeenCalled();
  });

  it("no pide permiso por su cuenta", () => {
    stubNotification("default");

    renderHook(() => usePushDeviceSync("u1"));

    expect(registerThisBrowser).not.toHaveBeenCalled();
    expect(Notification.requestPermission).not.toHaveBeenCalled();
  });

  it("no registra si el usuario nunca lo activo", () => {
    isPushWanted.mockReturnValue(false);

    renderHook(() => usePushDeviceSync("u1"));

    expect(registerThisBrowser).not.toHaveBeenCalled();
  });

  it("no repite el registro si el dispositivo ya esta registrado", () => {
    readPushDeviceId.mockReturnValue("dev1");

    renderHook(() => usePushDeviceSync("u1"));

    expect(registerThisBrowser).not.toHaveBeenCalled();
  });
});
