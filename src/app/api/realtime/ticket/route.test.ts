import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const createSocketTicket = vi.hoisted(() => vi.fn());
vi.mock("@/services/messages/service", () => ({ createSocketTicket }));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt-secreto" });
});

describe("POST /api/realtime/ticket", () => {
  it("responde 401 sin sesion y no pide ticket", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(createSocketTicket).not.toHaveBeenCalled();
  });

  it("canjea el JWT de la sesion por un ticket y devuelve solo el ticket", async () => {
    createSocketTicket.mockResolvedValue({
      ok: true,
      status: 201,
      data: { ticket: "abc123", expires_in: 30 },
    });

    const response = await POST();
    const body = await response.json();

    expect(createSocketTicket).toHaveBeenCalledWith("jwt-secreto");
    expect(response.status).toBe(200);
    expect(body).toEqual({ ticket: "abc123" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("el JWT nunca llega en la respuesta al navegador", async () => {
    createSocketTicket.mockResolvedValue({
      ok: true,
      status: 201,
      data: { ticket: "abc123", expires_in: 30 },
    });

    const text = await (await POST()).text();

    expect(text).not.toContain("jwt-secreto");
  });

  it("un 401 del back se trata como sesion vencida", async () => {
    createSocketTicket.mockResolvedValue({
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "x",
    });

    expect((await POST()).status).toBe(401);
  });

  it("si el servicio no puede guardar el ticket (503) sale como 502", async () => {
    createSocketTicket.mockResolvedValue({
      ok: false,
      status: 503,
      code: "TICKET_UNAVAILABLE",
      message: "x",
    });

    const response = await POST();

    expect(response.status).toBe(502);
    expect((await response.json()).ok).toBe(false);
  });
});
