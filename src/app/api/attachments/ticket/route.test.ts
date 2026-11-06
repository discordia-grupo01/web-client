import { ATTACHMENT_UPLOAD_FAILED } from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const createAttachmentTicket = vi.hoisted(() => vi.fn());
vi.mock("@/services/attachments/service", () => ({ createAttachmentTicket }));

import { POST } from "./route";

const failure = (status: number) => ({
  ok: false,
  status,
  code: "X",
  message: "x",
});

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt-secreto" });
});

describe("POST /api/attachments/ticket", () => {
  it("responde 401 sin sesion y no pide ticket", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(createAttachmentTicket).not.toHaveBeenCalled();
  });

  it("canjea el JWT por un ticket y devuelve solo el ticket", async () => {
    createAttachmentTicket.mockResolvedValue({
      ok: true,
      status: 201,
      data: { ticket: "abc123", expires_in: 60 },
    });

    const response = await POST();

    expect(createAttachmentTicket).toHaveBeenCalledWith("jwt-secreto");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ticket: "abc123" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("un 401 del back se trata como sesion vencida", async () => {
    createAttachmentTicket.mockResolvedValue(failure(401));

    expect((await POST()).status).toBe(401);
  });

  it("si el servicio no puede guardar el ticket (503) sale como 502", async () => {
    createAttachmentTicket.mockResolvedValue(failure(503));

    const response = await POST();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: ATTACHMENT_UPLOAD_FAILED,
    });
  });
});
