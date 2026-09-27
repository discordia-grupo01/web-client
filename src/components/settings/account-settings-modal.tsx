"use client";

import { ChevronLeft, ChevronRight, Moon, Shield } from "lucide-react";
import { useState } from "react";

import { ModalShell } from "@/components/ui/modal-shell";
import { TwoFactorSummaryRow } from "@/components/security/two-factor-summary-row";
import { cn } from "@/lib/cn";

import { AppearanceSettings } from "./appearance-settings";

type Section = "appearance" | "security";

const SECTIONS: {
  id: Section;
  label: string;
  description: string;
  icon: typeof Moon;
}[] = [
  {
    id: "appearance",
    label: "Apariencia",
    description: "Tema de la aplicación",
    icon: Moon,
  },
  {
    id: "security",
    label: "Seguridad",
    description: "Acceso y verificación",
    icon: Shield,
  },
];

interface AccountSettingsModalProps {
  onClose: () => void;
}

export function AccountSettingsModal({ onClose }: AccountSettingsModalProps) {
  const [section, setSection] = useState<Section>("appearance");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  const activeSection = SECTIONS.find((item) => item.id === section);

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="account-settings-title"
      maxWidth={880}
    >
      <div className="flex h-[min(720px,85dvh)] w-full">
        <aside className="border-line bg-surface-sunken hidden w-56 shrink-0 flex-col p-4 sm:flex">
          <div className="px-3 pt-2 pb-5">
            <p className="text-content-subtle text-xs font-bold tracking-widest uppercase">
              Configuración
            </p>
            <h2
              id="account-settings-title"
              className="text-content font-display mt-1 text-lg font-bold"
            >
              Mi cuenta
            </h2>
          </div>
          <nav className="space-y-1">
            {SECTIONS.map((item) => {
              const active = section === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
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
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-line flex shrink-0 items-center justify-between border-b px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              {!mobileMenuOpen ? (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Volver a configuración"
                  className="bg-surface-input text-content-muted flex size-10 cursor-pointer items-center justify-center rounded-xl sm:hidden"
                >
                  <ChevronLeft size={18} />
                </button>
              ) : null}
              <div>
                <p className="text-content-subtle text-[10px] font-bold tracking-widest uppercase sm:hidden">
                  Configuración de cuenta
                </p>
                <h2 className="text-content font-display text-lg font-bold">
                  {mobileMenuOpen ? "Mi cuenta" : activeSection?.label}
                </h2>
              </div>
            </div>
          </header>

          {mobileMenuOpen ? (
            <nav className="flex-1 space-y-3 overflow-y-auto p-4 sm:hidden">
              <p className="text-content-muted mb-4 text-sm leading-relaxed">
                Elegí qué aspecto de tu cuenta querés configurar.
              </p>
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
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
                    <ChevronRight size={18} className="text-content-subtle" />
                  </button>
                );
              })}
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
            ) : (
              <div className="mx-auto max-w-2xl">
                <div className="mb-6">
                  <h3 className="text-content font-display text-xl font-bold">
                    Seguridad y acceso
                  </h3>
                  <p className="text-content-muted mt-1 text-sm">
                    Administrá las medidas que protegen tu cuenta.
                  </p>
                </div>
                <TwoFactorSummaryRow />
              </div>
            )}
          </div>
        </main>
      </div>
    </ModalShell>
  );
}
