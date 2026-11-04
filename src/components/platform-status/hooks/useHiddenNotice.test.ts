import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useHiddenNotice } from "./useHiddenNotice";

describe("useHiddenNotice", () => {
  afterEach(() => sessionStorage.clear());

  it("oculta el aviso para el conjunto de incidentes actual", () => {
    const { result } = renderHook(() => useHiddenNotice("a,b"));
    expect(result.current.isHidden).toBe(false);

    act(() => result.current.hide());
    expect(result.current.isHidden).toBe(true);
  });

  it("vuelve a mostrarlo si cambian los incidentes", () => {
    const { result, rerender } = renderHook(({ key }) => useHiddenNotice(key), {
      initialProps: { key: "a" },
    });
    act(() => result.current.hide());

    rerender({ key: "a,b" });
    expect(result.current.isHidden).toBe(false);
  });

  it("recuerda lo ocultado al volver a montarse en la misma pestaña", () => {
    const first = renderHook(() => useHiddenNotice("a"));
    act(() => first.result.current.hide());
    first.unmount();

    const second = renderHook(() => useHiddenNotice("a"));
    expect(second.result.current.isHidden).toBe(true);
  });
});
