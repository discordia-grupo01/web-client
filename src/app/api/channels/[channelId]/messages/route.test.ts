import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const listMessages = vi.hoisted(() => vi.fn());
vi.mock("@/services/messages/service", () => ({ listMessages }));

import { NextRequest } from "next/server";

import { GET } from "./route";

function call(query = "") {
  return GET(
    new NextRequest(`http://localhost/api/channels/ch1/messages${query}`),
    { params: { channelId: "ch1" } },
  );
}

const MESSAGE = {
  id: "m1",
  channel_id: "ch1",
  server_id: "s1",
  user_id: "u1",
  content: "hola",
  inserted_at: "2026-10-01T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt" });
});

describe("GET /api/channels/:channelId/messages", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await call();

    expect(response.status).toBe(401);
    expect(listMessages).not.toHaveBeenCalled();
  });

  it("devuelve el historial con el cursor en camelCase", async () => {
    listMessages.mockResolvedValue({
      ok: true,
      status: 200,
      data: { messages: [MESSAGE], next_cursor: "m1" },
    });

    const response = await call();

    expect(await response.json()).toEqual({
      ok: true,
      messages: [MESSAGE],
      nextCursor: "m1",
    });
    expect(listMessages).toHaveBeenCalledWith("jwt", "ch1", {
      limit: undefined,
      before: undefined,
    });
  });

  it("pasa limit y before al back", async () => {
    listMessages.mockResolvedValue({
      ok: true,
      status: 200,
      data: { messages: [], next_cursor: null },
    });

    await call("?limit=20&before=m9");

    expect(listMessages).toHaveBeenCalledWith("jwt", "ch1", {
      limit: 20,
      before: "m9",
    });
  });

  it("ignora un limit que no es un entero positivo", async () => {
    listMessages.mockResolvedValue({
      ok: true,
      status: 200,
      data: { messages: [], next_cursor: null },
    });

    await call("?limit=abc");
    await call("?limit=-5");

    expect(listMessages).toHaveBeenNthCalledWith(1, "jwt", "ch1", {
      limit: undefined,
      before: undefined,
    });
    expect(listMessages).toHaveBeenNthCalledWith(2, "jwt", "ch1", {
      limit: undefined,
      before: undefined,
    });
  });

  it("traduce el codigo de error del back y conserva el status", async () => {
    listMessages.mockResolvedValue({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "x",
    });

    const response = await call();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      message: "No tenés permiso para enviar mensajes en este canal.",
      code: "FORBIDDEN",
    });
  });

  it("un 401 del back se trata como sesion vencida", async () => {
    listMessages.mockResolvedValue({
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "x",
    });

    expect((await call()).status).toBe(401);
  });

  it("un error del servidor sale como 502 con el mensaje generico de carga", async () => {
    listMessages.mockResolvedValue({
      ok: false,
      status: 500,
      code: "UNKNOWN_ERROR",
      message: "x",
    });

    const response = await call();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: "No pudimos cargar los mensajes. Intentá de nuevo.",
    });
  });
});
