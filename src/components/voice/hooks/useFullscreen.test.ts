import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFullscreen } from "./useFullscreen";

let fullscreenElement: Element | null = null;

function setFullscreenElement(element: Element | null) {
  fullscreenElement = element;
  document.dispatchEvent(new Event("fullscreenchange"));
}

function mountWithElement() {
  const element = document.createElement("div");
  element.requestFullscreen = vi.fn(() => {
    setFullscreenElement(element);
    return Promise.resolve();
  });
  const hook = renderHook(() => useFullscreen<HTMLDivElement>());
  Object.assign(hook.result.current.ref, { current: element });
  return { element, hook };
}

beforeEach(() => {
  fullscreenElement = null;
  Object.defineProperty(document, "fullscreenEnabled", {
    configurable: true,
    get: () => true,
  });
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fullscreenElement,
  });
  document.exitFullscreen = vi.fn(() => {
    setFullscreenElement(null);
    return Promise.resolve();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useFullscreen", () => {
  it("avisa si el navegador soporta pantalla completa", () => {
    const { hook } = mountWithElement();
    expect(hook.result.current.isSupported).toBe(true);
  });

  it("pone el elemento en pantalla completa y sale", () => {
    const { element, hook } = mountWithElement();

    act(() => hook.result.current.enter());
    expect(element.requestFullscreen).toHaveBeenCalled();
    expect(hook.result.current.isFullscreen).toBe(true);

    act(() => hook.result.current.exit());
    expect(document.exitFullscreen).toHaveBeenCalled();
    expect(hook.result.current.isFullscreen).toBe(false);
  });

  it("se entera cuando el navegador sale solo (Esc)", () => {
    const { hook } = mountWithElement();

    act(() => hook.result.current.enter());
    act(() => setFullscreenElement(null));

    expect(hook.result.current.isFullscreen).toBe(false);
  });

  it("no saca de pantalla completa a otro elemento", () => {
    const { hook } = mountWithElement();

    act(() => setFullscreenElement(document.createElement("div")));
    act(() => hook.result.current.exit());

    expect(document.exitFullscreen).not.toHaveBeenCalled();
    expect(hook.result.current.isFullscreen).toBe(false);
  });

  it("no rompe si el navegador lo niega", async () => {
    const { element, hook } = mountWithElement();
    element.requestFullscreen = vi.fn(() => Promise.reject(new Error("no")));

    act(() => hook.result.current.enter());
    await Promise.resolve();

    expect(hook.result.current.isFullscreen).toBe(false);
  });
});
