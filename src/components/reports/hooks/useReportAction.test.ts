import {
  type Report,
  REPORT_AUTO_RESOLVE_PENDING,
} from "@discordia/client-shared";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useReportAction } from "./useReportAction";
import type { CloseOutcome } from "./useReportsList";

vi.mock("@/services/messages/client", () => ({
  deleteMessageRequest: vi.fn(async () => ({ ok: true })),
}));

const report = { id: "r1", kind: "user" } as Report;
const target = { userId: "beto", name: "Beto", avatarSrc: null };

function setup(outcome: CloseOutcome) {
  const close = vi.fn(async () => outcome);
  const hook = renderHook(() => useReportAction(close));
  return { close, ...hook };
}

describe("useReportAction", () => {
  it("si la sancion sale bien, resuelve el reporte y avisa", async () => {
    const { result, close } = setup({ ok: true, alreadyClosed: false });
    act(() => result.current.start({ sanction: "mute", report, target }));

    await act(async () => result.current.sanctionApplied());

    expect(close).toHaveBeenCalledWith("r1", "resolved");
    expect(result.current.notice).toEqual({
      tone: "success",
      text: "Beto quedó silenciado y el reporte, resuelto.",
    });
  });

  it("si solo falla el PATCH, avisa que hay que resolverlo a mano", async () => {
    const { result } = setup({ ok: false, message: "x" });
    act(() => result.current.start({ sanction: "ban", report, target }));

    await act(async () => result.current.sanctionApplied());

    expect(result.current.notice).toEqual({
      tone: "error",
      text: REPORT_AUTO_RESOLVE_PENDING,
    });
  });

  it("si otro moderador ya lo cerro, la sancion cuenta como resuelta", async () => {
    const { result } = setup({
      ok: true,
      alreadyClosed: true,
      message: "Otro moderador ya cerró este reporte.",
    });
    act(() => result.current.start({ sanction: "kick", report, target }));

    await act(async () => result.current.sanctionApplied());

    expect(result.current.notice?.tone).toBe("success");
  });

  it("cerrar a mano muestra el error si falla", async () => {
    const { result } = setup({ ok: false, message: "No pudimos." });

    await act(() => result.current.closeManually(report, "dismissed"));

    expect(result.current.notice).toEqual({
      tone: "error",
      text: "No pudimos.",
    });
    expect(result.current.closingId).toBeNull();
  });
});
