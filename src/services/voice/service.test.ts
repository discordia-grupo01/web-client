import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const apiRequestWithBody = vi.hoisted(() => vi.fn());
vi.mock("@/lib/apiClient", () => ({ apiRequestWithBody }));

import { requestVoiceToken } from "./service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestVoiceToken", () => {
  it("conserva el codigo con el sobre nuevo de error", async () => {
    apiRequestWithBody.mockResolvedValue({
      result: { ok: false, status: 403, code: "VOICE_FORBIDDEN" },
      body: {
        error: { code: "VOICE_FORBIDDEN", message: "sin permiso", details: {} },
      },
    });

    const result = await requestVoiceToken("jwt", "c1");

    expect(result).toEqual({
      ok: false,
      status: 403,
      code: "voice_forbidden",
    });
  });

  it("sigue leyendo el formato viejo { error: codigo }", async () => {
    apiRequestWithBody.mockResolvedValue({
      result: { ok: false, status: 403, code: "FORBIDDEN" },
      body: { error: "voice_forbidden" },
    });

    const result = await requestVoiceToken("jwt", "c1");

    expect(result).toMatchObject({ ok: false, code: "voice_forbidden" });
  });
});
