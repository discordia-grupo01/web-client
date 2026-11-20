import type { StaffNotice } from "@discordia/client-shared";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listStaffNoticesRequest = vi.fn();
const markStaffNoticeSeenRequest = vi.fn();
let refreshOnChange: (() => unknown) | null = null;

vi.mock("@/services/notifications/client", () => ({
  listStaffNoticesRequest: () => listStaffNoticesRequest(),
  markStaffNoticeSeenRequest: (id: string) => markStaffNoticeSeenRequest(id),
}));

vi.mock("@/hooks/useRefreshOnChange", () => ({
  useRefreshOnChange: (_filter: unknown, refresh: () => unknown) => {
    refreshOnChange = refresh;
  },
}));

import { useStaffNotices } from "@/components/home/hooks/useStaffNotices";

const notice = (id: string, serverName: string): StaffNotice => ({
  id,
  kind: "server_deleted",
  server_id: `s-${id}`,
  server_name: serverName,
  occurred_at: "2026-11-20T14:03:11Z",
});

describe("useStaffNotices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshOnChange = null;
    markStaffNoticeSeenRequest.mockResolvedValue({ ok: true });
  });

  it("muestra el primer aviso pendiente al entrar", async () => {
    listStaffNoticesRequest.mockResolvedValue({
      ok: true,
      notices: [notice("n1", "Club"), notice("n2", "Taller")],
    });

    const { result } = renderHook(() => useStaffNotices());

    await waitFor(() => expect(result.current.notice?.id).toBe("n1"));
  });

  it("al cerrarlo lo marca visto y pasa al siguiente", async () => {
    listStaffNoticesRequest.mockResolvedValue({
      ok: true,
      notices: [notice("n1", "Club"), notice("n2", "Taller")],
    });
    const { result } = renderHook(() => useStaffNotices());
    await waitFor(() => expect(result.current.notice?.id).toBe("n1"));

    act(() => result.current.dismiss("n1"));

    expect(markStaffNoticeSeenRequest).toHaveBeenCalledWith("n1");
    expect(result.current.notice?.id).toBe("n2");
  });

  it("un listado viejo no vuelve a mostrar un aviso ya cerrado", async () => {
    listStaffNoticesRequest.mockResolvedValue({
      ok: true,
      notices: [notice("n1", "Club")],
    });
    const { result } = renderHook(() => useStaffNotices());
    await waitFor(() => expect(result.current.notice?.id).toBe("n1"));
    act(() => result.current.dismiss("n1"));

    await act(async () => {
      await refreshOnChange?.();
    });

    expect(result.current.notice).toBeNull();
  });

  it("vuelve a pedir los avisos cuando llega el cambio en vivo", async () => {
    listStaffNoticesRequest.mockResolvedValueOnce({ ok: true, notices: [] });
    const { result } = renderHook(() => useStaffNotices());
    await waitFor(() => expect(listStaffNoticesRequest).toHaveBeenCalled());
    listStaffNoticesRequest.mockResolvedValueOnce({
      ok: true,
      notices: [notice("n1", "Club")],
    });

    await act(async () => {
      await refreshOnChange?.();
    });

    expect(result.current.notice?.server_name).toBe("Club");
  });

  it("si falla el listado no muestra nada", async () => {
    listStaffNoticesRequest.mockResolvedValue({ ok: false, message: "x" });

    const { result } = renderHook(() => useStaffNotices());

    await waitFor(() => expect(listStaffNoticesRequest).toHaveBeenCalled());
    expect(result.current.notice).toBeNull();
  });
});
