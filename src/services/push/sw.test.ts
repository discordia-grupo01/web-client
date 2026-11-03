import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

const SOURCE = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

type Listener = (event: unknown) => void;

function loadWorker(windows: unknown[] = []) {
  const listeners: Record<string, Listener> = {};
  const self = {
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener;
    },
    skipWaiting: vi.fn(),
    clients: {
      claim: vi.fn(() => Promise.resolve()),
      matchAll: vi.fn(() => Promise.resolve(windows)),
      openWindow: vi.fn(() => Promise.resolve(null)),
    },
    registration: { showNotification: vi.fn(() => Promise.resolve()) },
  };
  new Function("self", SOURCE)(self);
  return { self, listeners };
}

function dispatch(listener: Listener, event: Record<string, unknown>) {
  const pending: Promise<unknown>[] = [];
  listener({
    ...event,
    waitUntil: (work: Promise<unknown>) => pending.push(work),
  });
  return Promise.all(pending);
}

const pushEvent = (payload: unknown) => ({
  data: { json: () => payload },
});

describe("service worker", () => {
  it("se activa de inmediato y toma el control de las pestanas", async () => {
    const { self, listeners } = loadWorker();

    listeners.install({});
    await dispatch(listeners.activate, {});

    expect(self.skipWaiting).toHaveBeenCalled();
    expect(self.clients.claim).toHaveBeenCalled();
  });

  describe("push", () => {
    it("muestra un mensaje de canal con su titulo y texto", async () => {
      const { self, listeners } = loadWorker();
      const data = {
        server_id: "s1",
        channel_id: "c1",
        message_id: "m1",
        author_id: "a1",
      };

      await dispatch(
        listeners.push,
        pushEvent({ title: "Server - general", body: "Ana: hola", data }),
      );

      expect(self.registration.showNotification).toHaveBeenCalledWith(
        "Server - general",
        {
          body: "Ana: hola",
          icon: "/push-icon.png",
          tag: "c1",
          renotify: true,
          data,
        },
      );
    });

    it("agrupa los mensajes directos por conversacion", async () => {
      const { self, listeners } = loadWorker();

      await dispatch(
        listeners.push,
        pushEvent({
          title: "Mensaje directo",
          body: "Beto: che",
          data: { conversation_id: "conv1", message_id: "m1", author_id: "b1" },
        }),
      );

      expect(self.registration.showNotification).toHaveBeenCalledWith(
        "Mensaje directo",
        expect.objectContaining({ tag: "conv1" }),
      );
    });

    it("conserva la marca de editado en los datos", async () => {
      const { self, listeners } = loadWorker();
      const data = {
        channel_id: "c1",
        message_id: "m1",
        author_id: "a1",
        edited: true,
      };

      await dispatch(
        listeners.push,
        pushEvent({ title: "t", body: "b (editado)", data }),
      );

      expect(self.registration.showNotification).toHaveBeenCalledWith(
        "t",
        expect.objectContaining({ data }),
      );
    });

    it("siempre muestra algo, aunque el mensaje venga incompleto", async () => {
      const { self, listeners } = loadWorker();

      await dispatch(listeners.push, pushEvent({}));

      expect(self.registration.showNotification).toHaveBeenCalledWith(
        "Discordia",
        expect.objectContaining({ body: "", data: {} }),
      );
    });

    it("siempre muestra algo, aunque no se pueda leer el cuerpo", async () => {
      const { self, listeners } = loadWorker();

      await dispatch(listeners.push, {
        data: {
          json: () => {
            throw new Error("no es JSON");
          },
        },
      });

      expect(self.registration.showNotification).toHaveBeenCalledWith(
        "Discordia",
        expect.objectContaining({ body: "" }),
      );
    });

    it("siempre muestra algo, aunque no traiga cuerpo", async () => {
      const { self, listeners } = loadWorker();

      await dispatch(listeners.push, { data: null });

      expect(self.registration.showNotification).toHaveBeenCalledWith(
        "Discordia",
        expect.any(Object),
      );
    });
  });

  describe("al tocar la notificacion", () => {
    const click = (data: unknown) => ({
      notification: { close: vi.fn(), data },
    });

    it("cierra la notificacion", async () => {
      const { listeners } = loadWorker();
      const event = click({ server_id: "s1" });

      await dispatch(listeners.notificationclick, event);

      expect(event.notification.close).toHaveBeenCalled();
    });

    it("abre una ventana en el servidor si no hay ninguna abierta", async () => {
      const { self, listeners } = loadWorker([]);

      await dispatch(listeners.notificationclick, click({ server_id: "s 1" }));

      expect(self.clients.openWindow).toHaveBeenCalledWith(
        "/home?server=s%201",
      );
    });

    it("abre la home si es un mensaje directo", async () => {
      const { self, listeners } = loadWorker([]);

      await dispatch(
        listeners.notificationclick,
        click({ conversation_id: "c1" }),
      );

      expect(self.clients.openWindow).toHaveBeenCalledWith("/home");
    });

    it("abre la home si la notificacion no trae datos", async () => {
      const { self, listeners } = loadWorker([]);

      await dispatch(listeners.notificationclick, click(undefined));

      expect(self.clients.openWindow).toHaveBeenCalledWith("/home");
    });

    it("reutiliza una ventana abierta: la enfoca y la lleva al chat directo", async () => {
      const navigate = vi.fn(() => Promise.resolve(null));
      const open = { focus: vi.fn(() => Promise.resolve({ navigate })) };
      const { self, listeners } = loadWorker([open]);

      await dispatch(
        listeners.notificationclick,
        click({ author_id: "b1", conversation_id: "c1" }),
      );

      expect(navigate).toHaveBeenCalledWith("/home?dm=b1");
      expect(self.clients.openWindow).not.toHaveBeenCalled();
    });

    it("reutiliza una ventana abierta: la enfoca y la lleva al servidor", async () => {
      const navigate = vi.fn(() => Promise.resolve(null));
      const focused = { navigate };
      const open = { focus: vi.fn(() => Promise.resolve(focused)) };
      const { self, listeners } = loadWorker([open]);

      await dispatch(listeners.notificationclick, click({ server_id: "s1" }));

      expect(open.focus).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith("/home?server=s1");
      expect(self.clients.openWindow).not.toHaveBeenCalled();
    });

    it("si la ventana no se puede navegar, solo la enfoca", async () => {
      const open = { focus: vi.fn(() => Promise.resolve({})) };
      const { self, listeners } = loadWorker([open]);

      await dispatch(listeners.notificationclick, click({ server_id: "s1" }));

      expect(open.focus).toHaveBeenCalled();
      expect(self.clients.openWindow).not.toHaveBeenCalled();
    });
  });
});
