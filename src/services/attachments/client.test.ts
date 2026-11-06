import {
  ATTACHMENT_UPLOAD_FAILED,
  SESSION_EXPIRED_MESSAGE,
} from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { bffPost, directPost } = vi.hoisted(() => ({
  bffPost: vi.fn(),
  directPost: vi.fn(),
}));

vi.mock("@/lib/browserApiClient", () => ({ api: { post: bffPost } }));
vi.mock("@/lib/env", () => ({
  env: { uploadUrl: "https://gateway.test" },
}));
vi.mock("axios", () => ({ default: { post: directPost } }));

import { uploadAttachmentRequest } from "./client";

const file = new File(["hola"], "a b.png", { type: "image/png" });
const attachment = {
  id: "a1",
  url: "https://cdn.test/a1",
  name: "a b.png",
  content_type: "image/png",
  size: 4,
};

beforeEach(() => {
  vi.clearAllMocks();
  bffPost.mockResolvedValue({ data: { ticket: "abc123" } });
});

describe("uploadAttachmentRequest", () => {
  it("sube el archivo al gateway con el ticket y sin pasar por el BFF", async () => {
    directPost.mockResolvedValue({ status: 201, data: attachment });

    const result = await uploadAttachmentRequest(file, { channelId: "c1" });

    expect(bffPost).toHaveBeenCalledTimes(1);
    expect(bffPost).toHaveBeenCalledWith("/attachments/ticket");
    expect(directPost).toHaveBeenCalledWith(
      "https://gateway.test/v1/attachments/direct?channel_id=c1&filename=a%20b.png",
      file,
      expect.objectContaining({
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Upload-Ticket": "abc123",
        },
      }),
    );
    expect(result).toEqual({ ok: true, attachment });
  });

  it("pide un ticket nuevo por cada archivo", async () => {
    directPost.mockResolvedValue({ status: 201, data: attachment });

    await uploadAttachmentRequest(file, { to: "u1" });
    await uploadAttachmentRequest(file, { to: "u1" });

    expect(bffPost).toHaveBeenCalledTimes(2);
  });

  it("con la sesion vencida muestra ese error y no sube nada", async () => {
    bffPost.mockResolvedValue({
      data: { ok: false, message: SESSION_EXPIRED_MESSAGE },
    });

    const result = await uploadAttachmentRequest(file, { to: "u1" });

    expect(directPost).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, message: SESSION_EXPIRED_MESSAGE });
  });

  it("traduce el codigo de error del back", async () => {
    directPost.mockResolvedValue({
      status: 413,
      data: { error: { code: "FILE_TOO_LARGE", message: "too large" } },
    });

    const result = await uploadAttachmentRequest(file, { to: "u1" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).not.toBe(ATTACHMENT_UPLOAD_FAILED);
      expect(result.message).not.toBe("too large");
    }
  });

  it("si la red falla devuelve el error generico", async () => {
    directPost.mockRejectedValue(new Error("Network Error"));

    expect(await uploadAttachmentRequest(file, { to: "u1" })).toEqual({
      ok: false,
      message: ATTACHMENT_UPLOAD_FAILED,
    });
  });
});
