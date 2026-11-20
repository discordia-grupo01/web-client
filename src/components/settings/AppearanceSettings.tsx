"use client";

import { CircleCheckBig, Moon, Sun } from "lucide-react";

import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { cn } from "@/lib/cn";
import { useTheme } from "@/hooks/useTheme";

interface ThemeCardProps {
  active: boolean;
  onClick: () => void;
  icon: typeof Moon;
  iconClassName: string;
  title: string;
  description: string;
  preview: React.ReactNode;
}

function ThemeCard({
  active,
  onClick,
  icon: Icon,
  iconClassName,
  title,
  description,
  preview,
}: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "bg-surface-raised cursor-pointer overflow-hidden rounded-2xl border-2 text-left transition-colors",
        active ? "border-accent" : "border-line",
      )}
    >
      <div className="h-28">{preview}</div>
      <div className="flex items-center gap-3 p-4">
        <Icon size={19} className={cn("shrink-0", iconClassName)} />
        <span className="min-w-0 flex-1">
          <strong className="text-content font-display block text-sm">
            {title}
          </strong>
          <small className="text-content-subtle">{description}</small>
        </span>
        {active ? (
          <CircleCheckBig size={19} className="text-success shrink-0" />
        ) : null}
      </div>
    </button>
  );
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsSection description="Elegí cómo se ve Discordia. El tema se aplica inmediatamente en toda la aplicación.">
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <ThemeCard
          active={theme === "dark"}
          onClick={() => setTheme("dark")}
          icon={Moon}
          iconClassName="text-sky"
          title="Modo oscuro"
          description="Azul profundo, menos brillo"
          preview={
            <div
              className="flex h-full gap-2 rounded-lg p-2"
              style={{ background: "#1C293B" }}
            >
              <div
                className="w-1/4 rounded"
                style={{ background: "#245C6B" }}
              />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 w-2/3 rounded-full bg-white/30" />
                <div className="h-2 w-full rounded-full bg-white/10" />
                <div className="h-2 w-4/5 rounded-full bg-white/10" />
              </div>
            </div>
          }
        />

        <ThemeCard
          active={theme === "light"}
          onClick={() => setTheme("light")}
          icon={Sun}
          iconClassName="text-highlight"
          title="Modo claro"
          description="Paper, cálido y luminoso"
          preview={
            <div
              className="flex h-full gap-2 rounded-lg p-2"
              style={{ background: "#EAE5D9" }}
            >
              <div
                className="w-1/4 rounded"
                style={{ background: "#245C6B" }}
              />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 w-2/3 rounded-full bg-[#245C6B]/40" />
                <div className="h-2 w-full rounded-full bg-[#245C6B]/15" />
                <div className="h-2 w-4/5 rounded-full bg-[#245C6B]/15" />
              </div>
            </div>
          }
        />
      </div>
    </SettingsSection>
  );
}
