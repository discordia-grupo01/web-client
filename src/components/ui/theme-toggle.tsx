"use client";

import { Moon, Sun } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const goingToLight = theme === "dark";

  return (
    <IconButton
      icon={goingToLight ? Sun : Moon}
      label={goingToLight ? "Tema claro" : "Tema oscuro"}
      onClick={toggleTheme}
    />
  );
}
