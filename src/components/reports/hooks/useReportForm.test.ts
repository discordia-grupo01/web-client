import {
  type Message,
  REPORT_MESSAGE_CATEGORIES,
  unknownAuthor,
} from "@discordia/client-shared";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createReportRequest } from "@/services/reports/client";

import { useReportForm } from "./useReportForm";

vi.mock("@/services/reports/client", () => ({
  createReportRequest: vi.fn(),
}));

const spam = REPORT_MESSAGE_CATEGORIES[0]!;
const other = REPORT_MESSAGE_CATEGORIES.find((c) => c.id === "other")!;
const message = {
  id: "m1",
  channel_id: "c1",
  user_id: "beto",
  content: "hola",
} as Message;
const target = {
  kind: "message" as const,
  message,
  author: unknownAuthor("beto"),
};

describe("useReportForm", () => {
  beforeEach(() => {
    vi.mocked(createReportRequest).mockReset();
  });

  it("manda categoria y detalle juntos en el motivo", async () => {
    vi.mocked(createReportRequest).mockResolvedValue({
      ok: true,
      report: {} as never,
    });
    const { result } = renderHook(() => useReportForm("s1", target));

    act(() => result.current.chooseCategory(spam));
    act(() => result.current.setDetail("  links raros "));
    await act(() => result.current.submit());

    expect(createReportRequest).toHaveBeenCalledWith("s1", {
      kind: "message",
      channelId: "c1",
      messageId: "m1",
      reason: "Spam: links raros",
    });
    expect(result.current.step).toBe("sent");
  });

  it("en Otro no envia sin detalle y muestra el error", async () => {
    const { result } = renderHook(() => useReportForm("s1", target));

    act(() => result.current.chooseCategory(other));
    expect(result.current.detailError).toBeUndefined();
    await act(() => result.current.submit());

    expect(createReportRequest).not.toHaveBeenCalled();
    expect(result.current.detailError).toMatch(/Contanos/);
  });

  it("si el back rechaza (reporte duplicado) se queda en el paso con el error", async () => {
    vi.mocked(createReportRequest).mockResolvedValue({
      ok: false,
      message: "Ya tenés un reporte pendiente sobre este contenido.",
    });
    const { result } = renderHook(() => useReportForm("s1", target));

    act(() => result.current.chooseCategory(spam));
    await act(() => result.current.submit());

    expect(result.current.step).toBe("details");
    expect(result.current.errorMessage).toMatch(/reporte pendiente/);
  });
});
