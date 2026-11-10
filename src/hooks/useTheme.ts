"use client";

import { DEFAULT_THEME, type ThemeName } from "@discordia/client-shared";
import { useCallback, useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "@/lib/constants";

function isThemeName(value: unknown): value is ThemeName {
  return value === "dark" || value === "light";
}

function readTheme(): ThemeName {
  const current = document.documentElement.dataset.theme;
  return isThemeName(current) ? current : DEFAULT_THEME;
}

function readServerTheme(): ThemeName {
  return DEFAULT_THEME;
}

function applyToDocument(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // Otra pestaña cambio el tema: se aplica aca tambien.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY && isThemeName(event.newValue)) {
      applyToDocument(event.newValue);
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, readServerTheme);

  const setTheme = useCallback((next: ThemeName) => {
    applyToDocument(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // No poder recordarlo no impide cambiarlo en esta sesion.
    }
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(readTheme() === "dark" ? "light" : "dark"),
    [setTheme],
  );

  return { theme, setTheme, toggleTheme };
}
