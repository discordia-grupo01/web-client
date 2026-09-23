"use client";

import { DEFAULT_THEME, type ThemeName } from "@discordia/client-shared";
import { useEffect, useState } from "react";

import { THEME_STORAGE_KEY } from "@/lib/constants";

function readStoredTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    // Ventana privada o cookies bloqueadas: se usa el tema por defecto.
    return null;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(
      readStoredTheme() ??
        (current === "light" || current === "dark" ? current : DEFAULT_THEME),
    );
  }, []);

  function applyTheme(next: ThemeName) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // No poder recordarlo no impide cambiarlo en esta sesion.
    }
  }

  return {
    theme,
    toggleTheme: () => applyTheme(theme === "dark" ? "light" : "dark"),
  };
}
