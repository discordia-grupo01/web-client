import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePagedItems } from "./usePagedItems";

const items = Array.from({ length: 23 }, (_, index) => index + 1);

describe("usePagedItems", () => {
  it("muestra la primera página y cuántas hay", () => {
    const { result } = renderHook(() => usePagedItems(items, 10));

    expect(result.current.pageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.current.pageCount).toBe(3);
    expect(result.current.range).toEqual({ from: 1, to: 10 });
  });

  it("la última página trae solo lo que queda", () => {
    const { result } = renderHook(() => usePagedItems(items, 10));

    act(() => result.current.setPage(3));

    expect(result.current.pageItems).toEqual([21, 22, 23]);
    expect(result.current.range).toEqual({ from: 21, to: 23 });
  });

  it("si la lista se achica, no queda en una página vacía", () => {
    const { result, rerender } = renderHook(
      ({ list }) => usePagedItems(list, 10),
      { initialProps: { list: items } },
    );

    act(() => result.current.setPage(3));
    rerender({ list: items.slice(0, 12) });

    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toEqual([11, 12]);
  });
});
