import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => {
  class FakeSocket {
    static instances: FakeSocket[] = [];
    params: () => { ticket: string };
    openCallback: (() => void) | null = null;
    closeCallback: (() => void) | null = null;
    connect = vi.fn();
    disconnect = vi.fn((callback?: () => void) => callback?.());
    constructor(
      public url: string,
      options: { params: () => { ticket: string } },
    ) {
      this.params = options.params;
      FakeSocket.instances.push(this);
    }
    onOpen(callback: () => void) {
      this.openCallback = callback;
    }
    onClose(callback: () => void) {
      this.closeCallback = callback;
    }
  }
  return { FakeSocket };
});

vi.mock("phoenix", () => ({ Socket: fake.FakeSocket }));
vi.mock("./client", () => ({ fetchSocketTicketRequest: vi.fn() }));

import { fetchSocketTicketRequest } from "./client";

type SocketModule = typeof import("./socket");
let socketModule: SocketModule;

function ticket(value: string) {
  return { ok: true as const, ticket: value };
}

const TRANSIENT = { ok: false as const, sessionExpired: false };
const SESSION_DEAD = { ok: false as const, sessionExpired: true };

function lastSocket() {
  const [socket] = fake.FakeSocket.instances;
  return socket;
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  fake.FakeSocket.instances.length = 0;
  vi.mocked(fetchSocketTicketRequest).mockResolvedValue(ticket("A"));
  // El manager guarda el socket en una variable de modulo: uno nuevo por test.
  vi.resetModules();
  socketModule = await import("./socket");
});

afterEach(() => {
  socketModule.closeSocket();
  vi.useRealTimers();
});

describe("acquireSocket", () => {
  it("abre un solo socket aunque lo pidan varios a la vez", async () => {
    const [a, b] = await Promise.all([
      socketModule.acquireSocket(),
      socketModule.acquireSocket(),
    ]);

    expect(a.ok && b.ok).toBe(true);
    expect(fetchSocketTicketRequest).toHaveBeenCalledTimes(1);
    expect(fake.FakeSocket.instances).toHaveLength(1);
    expect(lastSocket().connect).toHaveBeenCalledTimes(1);
  });

  it("conecta a la URL del gateway con el ticket", async () => {
    await socketModule.acquireSocket();

    expect(lastSocket().url).toMatch(/^wss?:\/\/.+\/socket$/);
    expect(lastSocket().params()).toEqual({ ticket: "A" });
  });

  it("el ticket es de un solo uso: se entrega una vez y no se reutiliza", async () => {
    await socketModule.acquireSocket();

    expect(lastSocket().params()).toEqual({ ticket: "A" });
    expect(lastSocket().params()).toEqual({ ticket: "" });
  });

  it("si no hay sesion para pedir el ticket no abre el socket", async () => {
    vi.mocked(fetchSocketTicketRequest).mockResolvedValue(SESSION_DEAD);

    expect(await socketModule.acquireSocket()).toEqual({
      ok: false,
      sessionExpired: true,
    });
    expect(fake.FakeSocket.instances).toHaveLength(0);
  });

  it("un fallo transitorio se distingue de una sesion muerta", async () => {
    vi.mocked(fetchSocketTicketRequest).mockResolvedValue(TRANSIENT);

    expect(await socketModule.acquireSocket()).toEqual({
      ok: false,
      sessionExpired: false,
    });
  });
});

describe("release", () => {
  it("cierra el socket cuando nadie lo usa, no antes", async () => {
    const a = await socketModule.acquireSocket();
    const b = await socketModule.acquireSocket();
    if (!a.ok || !b.ok) throw new Error("no abrio");

    a.release();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(lastSocket().disconnect).not.toHaveBeenCalled();

    b.release();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(lastSocket().disconnect).toHaveBeenCalledTimes(1);
  });

  it("no cierra si alguien lo vuelve a pedir enseguida (cambio de canal)", async () => {
    const first = await socketModule.acquireSocket();
    if (!first.ok) throw new Error("no abrio");
    first.release();

    await vi.advanceTimersByTimeAsync(1_000);
    const second = await socketModule.acquireSocket();
    await vi.advanceTimersByTimeAsync(20_000);

    expect(second.ok).toBe(true);
    expect(fake.FakeSocket.instances).toHaveLength(1);
    expect(lastSocket().disconnect).not.toHaveBeenCalled();
  });

  it("es idempotente: soltar dos veces no resta de mas", async () => {
    const a = await socketModule.acquireSocket();
    const b = await socketModule.acquireSocket();
    if (!a.ok || !b.ok) throw new Error("no abrio");

    a.release();
    a.release();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(lastSocket().disconnect).not.toHaveBeenCalled();
  });
});

describe("reconexion con un ticket nuevo", () => {
  async function openAndClose() {
    await socketModule.acquireSocket();
    const socket = lastSocket();
    socket.params(); // Phoenix consume el ticket al conectar
    socket.connect.mockClear();
    socket.disconnect.mockClear();
    return socket;
  }

  it("al cerrarse pide un ticket nuevo y vuelve a conectar con el", async () => {
    const socket = await openAndClose();
    vi.mocked(fetchSocketTicketRequest).mockResolvedValue(ticket("B"));

    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    expect(socket.params()).toEqual({ ticket: "B" });
  });

  it("cada reconexion usa un ticket distinto", async () => {
    const socket = await openAndClose();

    vi.mocked(fetchSocketTicketRequest).mockResolvedValue(ticket("B"));
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.params()).toEqual({ ticket: "B" });
    socket.openCallback?.();

    vi.mocked(fetchSocketTicketRequest).mockResolvedValue(ticket("C"));
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.params()).toEqual({ ticket: "C" });
  });

  it("ignora un segundo cierre mientras la reconexion esta en curso", async () => {
    const socket = await openAndClose();
    vi.mocked(fetchSocketTicketRequest).mockReturnValue(new Promise(() => {}));

    socket.closeCallback?.();
    socket.closeCallback?.();
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(fetchSocketTicketRequest).toHaveBeenCalledTimes(2); // 1 de apertura + 1
  });

  it("si el ticket falla por la red reintenta con backoff hasta lograrlo", async () => {
    const socket = await openAndClose();
    vi.mocked(fetchSocketTicketRequest)
      .mockResolvedValueOnce(TRANSIENT)
      .mockResolvedValueOnce(TRANSIENT)
      .mockResolvedValueOnce(ticket("B"));

    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.connect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1_000);
    expect(socket.connect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2_000);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    expect(socket.params()).toEqual({ ticket: "B" });
  });

  it("si el servidor rechaza el handshake una y otra vez, espera cada vez mas", async () => {
    const socket = await openAndClose();
    vi.mocked(fetchSocketTicketRequest).mockResolvedValue(ticket("X"));

    // 1er cierre: enseguida.
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.connect).toHaveBeenCalledTimes(1);

    // 2do cierre sin haber abierto: espera 1 s.
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.connect).toHaveBeenCalledTimes(2);

    // 3er cierre: espera 2 s.
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(1_500);
    expect(socket.connect).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.connect).toHaveBeenCalledTimes(3);
  });

  it("el backoff vuelve a cero cuando el socket llega a abrir", async () => {
    const socket = await openAndClose();
    vi.mocked(fetchSocketTicketRequest).mockResolvedValue(ticket("X"));

    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(socket.connect).toHaveBeenCalledTimes(2);

    socket.openCallback?.();
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(socket.connect).toHaveBeenCalledTimes(3);
  });

  it("si la sesion murio al pedir el ticket cierra el socket y avisa", async () => {
    const socket = await openAndClose();
    const listener = vi.fn();
    socketModule.onSocketSessionExpired(listener);
    vi.mocked(fetchSocketTicketRequest).mockResolvedValue(SESSION_DEAD);

    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it("no reconecta cuando el cierre lo provoca el propio manager", async () => {
    const socket = await openAndClose();
    vi.mocked(fetchSocketTicketRequest).mockClear();

    socketModule.closeSocket();
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(5_000);

    expect(fetchSocketTicketRequest).not.toHaveBeenCalled();
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it("no reconecta mientras la pagina se esta yendo (Phoenix cierra a proposito)", async () => {
    const socket = await openAndClose();
    vi.mocked(fetchSocketTicketRequest).mockClear();

    window.dispatchEvent(new Event("pagehide"));
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(fetchSocketTicketRequest).not.toHaveBeenCalled();

    // Al volver, Phoenix reintenta con el ticket gastado, falla y se cierra
    // de nuevo: ahi si se pide uno nuevo.
    window.dispatchEvent(new Event("pageshow"));
    vi.mocked(fetchSocketTicketRequest).mockResolvedValue(ticket("B"));
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(socket.params()).toEqual({ ticket: "B" });
  });
});
