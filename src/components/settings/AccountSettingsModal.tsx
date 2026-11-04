"use client";

import type { TwoFactorStatus } from "@discordia/client-shared";

import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Shield,
} from "lucide-react";
import { useState } from "react";

import { PlatformStatusSettings } from "@/components/platform-status/PlatformStatusSettings";
import { LogoutConfirmModal } from "@/components/profile/LogoutConfirmModal";
import { TwoFactorPanel } from "@/components/security/TwoFactorPanel";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/cn";

import { AppearanceSettings } from "./AppearanceSettings";
import { PushSettings } from "./PushSettings";
import { SecuritySettings } from "./SecuritySettings";

type Section = "appearance" | "notifications" | "security" | "status";

interface SectionItem {
  id: Section;
  label: string;
  description: string;
  icon: typeof Moon;
}

const ACCOUNT_SECTIONS: SectionItem[] = [
  {
    id: "appearance",
    label: "Apariencia",
    description: "Tema de la aplicación",
    icon: Moon,
  },
  {
    id: "notifications",
    label: "Notificaciones",
    description: "Avisos push",
    icon: Bell,
  },
  {
    id: "security",
    label: "Seguridad",
    description: "Acceso y verificación",
    icon: Shield,
  },
];

const PLATFORM_SECTIONS: SectionItem[] = [
  {
    id: "status",
    label: "Estado de la plataforma",
    description: "Servicios e incidentes",
    icon: Activity,
  },
];

const SECTION_GROUPS = [
  { title: "Mi cuenta", items: ACCOUNT_SECTIONS },
  { title: "Plataforma", items: PLATFORM_SECTIONS },
];

const SECTIONS = [...ACCOUNT_SECTIONS, ...PLATFORM_SECTIONS];

interface AccountSettingsModalProps {
  onClose: () => void;
}

export function AccountSettingsModal({ onClose }: AccountSettingsModalProps) {
  const [section, setSection] = useState<Section>("appearance");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] =
    useState<TwoFactorStatus | null>(null);

  const activeSection = SECTIONS.find((item) => item.id === section);
  const isTwoFactorOpen = section === "security" && twoFactorStatus !== null;

  function selectSection(next: Section) {
    setSection(next);
    setTwoFactorStatus(null);
  }

  function goBack() {
    if (isTwoFactorOpen) setTwoFactorStatus(null);
    else setMobileMenuOpen(true);
  }

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="account-settings-title"
      maxWidth={880}
      isFullScreenOnMobile
    >
      <div className="flex min-h-0 w-full flex-1 sm:h-[min(720px,85dvh)] sm:flex-none">
        <aside className="border-line bg-surface-sunken hidden w-56 shrink-0 flex-col p-4 sm:flex">
          <div className="px-3 pt-2 pb-5">
            <h2
              id="account-settings-title"
              className="text-content font-display text-lg font-bold"
            >
              Configuración
            </h2>
          </div>
          <nav className="space-y-5">
            {SECTION_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-content-muted font-display px-3 pb-2 text-sm font-semibold">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = section === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectSection(item.id)}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                          active
                            ? "bg-accent text-on-accent"
                            : "text-content-muted hover:bg-surface-hover",
                        )}
                      >
                        <Icon size={17} />
                        <span className="min-w-0">
                          <strong className="font-display block text-sm">
                            {item.label}
                          </strong>
                          <small className="block truncate opacity-60">
                            {item.description}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setIsLogoutOpen(true)}
            className="text-danger hover:bg-danger/10 mt-auto flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
          >
            <LogOut size={17} />
            <strong className="font-display text-sm">Cerrar sesión</strong>
          </button>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-line flex shrink-0 items-center justify-between border-b px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              {!mobileMenuOpen || isTwoFactorOpen ? (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Volver"
                  className={cn(
                    "bg-surface-input text-content-muted hover:bg-surface-hover sm:hover:text-content flex size-10 cursor-pointer items-center justify-center rounded-xl transition-colors sm:-ml-1 sm:size-7 sm:bg-transparent sm:hover:bg-transparent",
                    !isTwoFactorOpen && "sm:hidden",
                  )}
                >
                  <ChevronLeft size={18} />
                </button>
              ) : null}
              <div>
                <h2 className="text-content font-display text-lg font-bold">
                  {isTwoFactorOpen ? (
                    "Verificación en dos pasos"
                  ) : (
                    <>
                      <span
                        className={cn(mobileMenuOpen ? "sm:hidden" : "hidden")}
                      >
                        Configuración
                      </span>
                      <span
                        className={cn(mobileMenuOpen ? "hidden sm:inline" : "")}
                      >
                        {activeSection?.label}
                      </span>
                    </>
                  )}
                </h2>
              </div>
            </div>
          </header>

          {mobileMenuOpen ? (
            <nav className="flex-1 space-y-6 overflow-y-auto p-4 sm:hidden">
              {SECTION_GROUPS.map((group) => (
                <div key={group.title} className="space-y-3">
                  <p className="text-content-muted font-display px-1 pt-1 text-sm font-semibold">
                    {group.title}
                  </p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          selectSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className="bg-surface-raised border-line text-content-muted flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left"
                      >
                        <span className="bg-surface-input text-info flex size-11 shrink-0 items-center justify-center rounded-xl">
                          <Icon size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="text-content font-display block text-base">
                            {item.label}
                          </strong>
                          <small className="text-content-subtle">
                            {item.description}
                          </small>
                        </span>
                        <ChevronRight
                          size={18}
                          className="text-content-subtle"
                        />
                      </button>
                    );
                  })}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setIsLogoutOpen(true)}
                className="bg-surface-raised border-line text-danger flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left"
              >
                <span className="bg-danger/10 flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <LogOut size={20} />
                </span>
                <strong className="font-display text-base">
                  Cerrar sesión
                </strong>
              </button>
            </nav>
          ) : null}

          <div
            className={cn(
              "flex-1 overflow-y-auto px-4 py-6 sm:block sm:px-8 sm:py-8",
              mobileMenuOpen ? "hidden" : "block",
            )}
          >
            {section === "appearance" ? (
              <AppearanceSettings />
            ) : section === "notifications" ? (
              <PushSettings />
            ) : section === "status" ? (
              <PlatformStatusSettings />
            ) : twoFactorStatus ? (
              <TwoFactorPanel
                initialStatus={twoFactorStatus}
                onBack={() => setTwoFactorStatus(null)}
              />
            ) : (
              <SecuritySettings onOpenTwoFactor={setTwoFactorStatus} />
            )}
          </div>
        </main>
      </div>
      {isLogoutOpen ? (
        <LogoutConfirmModal onClose={() => setIsLogoutOpen(false)} />
      ) : null}
    </ModalShell>
  );
}
