import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// La conexion, los tickets y la reconexion se prueban en `client-shared`
// (`createSocketManager`). Aca solo lo propio del navegador.
const fake = vi.hoisted(() => {
  class FakeSocket {
    static instances: FakeSocket[] = [];
    params: () => { ticket: string };
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
    onOpen() {}
    onClose(callback: () => void) {
      this.closeCallback = callback;
    }
    isConnected() {
      return false;
    }
  }
  return { FakeSocket };
});

vi.mock("phoenix", () => ({ Socket: fake.FakeSocket }));
vi.mock("./client", () => ({ fetchSocketTicketRequest: vi.fn() }));

import { fetchSocketTicketRequest } from "./client";

type SocketModule = typeof import("./socket");
let socketModule: SocketModule;

function lastSocket() {
  const [socket] = fake.FakeSocket.instances;
  return socket;
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  fake.FakeSocket.instances.length = 0;
  vi.mocked(fetchSocketTicketRequest).mockResolvedValue({
    ok: true,
    ticket: "A",
  });
  // El manager guarda el socket en una variable del modulo: uno nuevo por test.
  vi.resetModules();
  socketModule = await import("./socket");
});

afterEach(() => {
  socketModule.closeSocket();
  vi.useRealTimers();
});

describe("socket de web", () => {
  it("conecta a la URL del gateway con el ticket", async () => {
    await socketModule.acquireSocket();

    expect(lastSocket().url).toMatch(/^wss?:\/\/.+\/socket$/);
    expect(lastSocket().params()).toEqual({ ticket: "A" });
  });

  it("no reconecta mientras la pagina se esta yendo (Phoenix cierra a proposito)", async () => {
    await socketModule.acquireSocket();
    const socket = lastSocket();
    socket.params();
    vi.mocked(fetchSocketTicketRequest).mockClear();

    window.dispatchEvent(new Event("pagehide"));
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(fetchSocketTicketRequest).not.toHaveBeenCalled();

    // Al volver, Phoenix reintenta con el ticket gastado, falla y se cierra
    // de nuevo: ahi si se pide uno nuevo.
    window.dispatchEvent(new Event("pageshow"));
    vi.mocked(fetchSocketTicketRequest).mockResolvedValue({
      ok: true,
      ticket: "B",
    });
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(socket.params()).toEqual({ ticket: "B" });
  });
});
