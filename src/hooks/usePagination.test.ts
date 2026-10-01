import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePagination } from "./usePagination";

const items = Array.from({ length: 45 }, (_, index) => index + 1);

describe("usePagination", () => {
  it("arranca en la primera pagina con 20 por pagina", () => {
    const { result } = renderHook(() => usePagination(items));

    expect(result.current.page).toBe(1);
    expect(result.current.pageCount).toBe(3);
    expect(result.current.pageItems).toHaveLength(20);
    expect(result.current.range).toEqual({ from: 1, to: 20 });
  });

  it("cambiar el tamaño vuelve a la primera pagina", () => {
    const { result } = renderHook(() => usePagination(items, 10));

    act(() => result.current.setPage(3));
    act(() => result.current.setPageSize(25));

    expect(result.current.page).toBe(1);
    expect(result.current.pageCount).toBe(2);
    expect(result.current.pageItems).toHaveLength(25);
  });

  it("no deja pasarse de la ultima pagina", () => {
    const { result } = renderHook(() => usePagination(items));

    act(() => result.current.setPage(99));

    expect(result.current.page).toBe(3);
    expect(result.current.pageItems).toEqual([41, 42, 43, 44, 45]);
  });

  it("si la lista se achica, la pagina se corrige sola", () => {
    const { result, rerender } = renderHook(
      ({ list }) => usePagination(list, 10),
      {
        initialProps: { list: items },
      },
    );
    act(() => result.current.setPage(5));

    rerender({ list: items.slice(0, 12) });

    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toEqual([11, 12]);
  });

  it("una lista vacia tiene una pagina y rango 0", () => {
    const { result } = renderHook(() => usePagination([]));

    expect(result.current.pageCount).toBe(1);
    expect(result.current.range).toEqual({ from: 0, to: 0 });
  });
});
