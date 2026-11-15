import type { BillingResult } from "@discordia/client-shared";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOffsetPages } from "./useOffsetPages";

type Page = { items: string[]; total: number; limit: number };

const fetchPage = vi.fn<[number], Promise<BillingResult<Page>>>();
const countOf = (page: Page) => page.items.length;

function render() {
  return renderHook(() =>
    useOffsetPages({
      fetchPage,
      countOf,
      pageSize: 10,
      refreshOn: { resources: ["boosts"] },
    }),
  );
}

const ok = (items: string[], total: number): BillingResult<Page> => ({
  ok: true,
  data: { items, total, limit: 10 },
});

describe("useOffsetPages", () => {
  beforeEach(() => {
    fetchPage.mockReset();
  });

  it("pide la primera página y arma el resumen con el total", async () => {
    fetchPage.mockResolvedValue(ok(["a"], 13));
    const { result } = render();

    await waitFor(() => expect(result.current.data?.items).toEqual(["a"]));
    expect(fetchPage).toHaveBeenLastCalledWith(1);
    expect(result.current.pageCount).toBe(2);
    expect(result.current.range).toEqual({ from: 1, to: 10 });
  });

  it("si la página quedó vacía vuelve a la anterior", async () => {
    fetchPage.mockResolvedValue(ok(["a"], 11));
    const { result } = render();
    await waitFor(() => expect(result.current.data).not.toBeNull());

    fetchPage.mockImplementation(async (page) =>
      page === 2 ? ok([], 10) : ok(["b"], 10),
    );
    act(() => result.current.setPage(2));

    await waitFor(() => expect(result.current.page).toBe(1));
    await waitFor(() => expect(result.current.data?.items).toEqual(["b"]));
  });

  it("restart vuelve a la primera página", async () => {
    fetchPage.mockResolvedValue(ok(["a"], 25));
    const { result } = render();
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => result.current.setPage(3));
    await waitFor(() => expect(fetchPage).toHaveBeenLastCalledWith(3));

    act(() => result.current.restart());
    await waitFor(() => expect(result.current.page).toBe(1));
    expect(fetchPage).toHaveBeenLastCalledWith(1);
  });

  it("un error no borra la página que ya había", async () => {
    fetchPage.mockResolvedValueOnce(ok(["a"], 1));
    const { result } = render();
    await waitFor(() => expect(result.current.data).not.toBeNull());

    fetchPage.mockResolvedValueOnce({
      ok: false,
      code: "NETWORK_ERROR",
      message: "No pudimos cargar tus boosts.",
    });
    await act(() => result.current.reload());

    expect(result.current.loadError).toBe("No pudimos cargar tus boosts.");
    expect(result.current.data?.items).toEqual(["a"]);
  });
});
