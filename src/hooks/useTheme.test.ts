import { act, renderHook, waitFor } from "@testing-library/react";

import { THEME_STORAGE_KEY } from "@/lib/constants";

import { useTheme } from "./useTheme";

beforeEach(() => {
  document.documentElement.dataset.theme = "dark";
  localStorage.clear();
});

describe("useTheme", () => {
  it("lee el tema que dejo el script del layout", () => {
    document.documentElement.dataset.theme = "light";

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");
  });

  it("aplica el tema al documento y lo recuerda", async () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("light"));

    await waitFor(() => expect(result.current.theme).toBe("light"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("si Configuracion cambia el tema, el boton del header se entera", async () => {
    const header = renderHook(() => useTheme());
    const settings = renderHook(() => useTheme());

    act(() => settings.result.current.setTheme("light"));

    await waitFor(() => expect(header.result.current.theme).toBe("light"));
  });

  it("toggleTheme parte del tema actual aunque lo haya cambiado otro", async () => {
    const header = renderHook(() => useTheme());
    const settings = renderHook(() => useTheme());

    act(() => settings.result.current.setTheme("light"));
    await waitFor(() => expect(header.result.current.theme).toBe("light"));
    act(() => header.result.current.toggleTheme());

    await waitFor(() => expect(header.result.current.theme).toBe("dark"));
    expect(settings.result.current.theme).toBe("dark");
  });

  it("toma el cambio hecho en otra pestaña", async () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: "light",
        }),
      );
    });

    await waitFor(() => expect(result.current.theme).toBe("light"));
  });
});
