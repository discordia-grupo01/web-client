import type { ModerationAuditEntry } from "@discordia/client-shared";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listModerationAuditRequest } from "@/services/moderation/client";

import { useModerationAudit } from "./useModerationAudit";

vi.mock("@/services/moderation/client", () => ({
  listModerationAuditRequest: vi.fn(),
}));

const request = vi.mocked(listModerationAuditRequest);
const entry = { id: "a1", action: "kick" } as ModerationAuditEntry;

describe("useModerationAudit", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("pide la pagina con offset y calcula las paginas con el total", async () => {
    request.mockResolvedValue({ ok: true, entries: [entry], total: 45 });
    const { result } = renderHook(() => useModerationAudit("s1"));

    await waitFor(() => expect(result.current.entries).toEqual([entry]));
    expect(request).toHaveBeenLastCalledWith("s1", { limit: 15, offset: 0 });
    expect(result.current.pageCount).toBe(3);

    act(() => result.current.setPage(3));
    await waitFor(() =>
      expect(request).toHaveBeenLastCalledWith("s1", { limit: 15, offset: 30 }),
    );
  });

  it("si falla, deja el mensaje y una lista vacia", async () => {
    request.mockResolvedValue({ ok: false, message: "No se pudo." });
    const { result } = renderHook(() => useModerationAudit("s1"));

    await waitFor(() => expect(result.current.loadError).toBe("No se pudo."));
    expect(result.current.entries).toEqual([]);
  });
});
