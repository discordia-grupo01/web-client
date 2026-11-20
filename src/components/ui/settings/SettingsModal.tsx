"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/cn";

import {
  SettingsModalContext,
  type SettingsSubPage,
} from "./SettingsModalContext";
import { SettingsMobileMenu } from "./SettingsMobileMenu";
import { SettingsSidebar } from "./SettingsSidebar";
import type { SettingsDangerAction, SettingsNavGroup } from "./settingsNav";

const MODAL_MAX_WIDTH = 960;

interface SettingsModalProps<Id extends string> {
  menuTitle: string;
  menuSubtitle?: string;
  mobileMenuTitle: string;
  mobileMenuHeader?: ReactNode;
  groups: SettingsNavGroup<Id>[];
  activeId: Id;
  onSelect: (id: Id) => void;
  startOnMenu: boolean;
  dangerAction?: SettingsDangerAction;
  onClose: () => void;
  children: ReactNode;
  /** Confirmaciones que se abren encima: tienen que quedar dentro del portal. */
  dialogs?: ReactNode;
}

/** Va a `body` para que no lo esconda el panel que lo abre (el lateral de canales está oculto en celular). */
export function SettingsModal<Id extends string>({
  menuTitle,
  menuSubtitle,
  mobileMenuTitle,
  mobileMenuHeader,
  groups,
  activeId,
  onSelect,
  startOnMenu,
  dangerAction,
  onClose,
  children,
  dialogs,
}: SettingsModalProps<Id>) {
  const titleId = useId();
  const items = groups.flatMap((group) => group.items);
  // Con una sola sección (un miembro sin permisos) no hay menú que mostrar.
  const hasMenu = items.length > 1 || dangerAction !== undefined;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(
    startOnMenu && hasMenu,
  );
  const [subPage, setSubPage] = useState<SettingsSubPage | null>(null);
  const activeItem = items.find((item) => item.id === activeId);
  const sectionTitle = activeItem?.label ?? menuTitle;

  const contextValue = useMemo(
    () => ({
      setSubPage,
      heading: {
        titleId,
        title: subPage?.title ?? sectionTitle,
        onClose,
        back: subPage
          ? {
              label: `Volver a ${subPage.parent}`,
              onClick: subPage.onBack,
              isMobileOnly: false,
            }
          : hasMenu
            ? {
                label: "Volver a la lista de secciones",
                onClick: () => setIsMobileMenuOpen(true),
                isMobileOnly: true,
              }
            : undefined,
      },
    }),
    [titleId, subPage, sectionTitle, hasMenu, onClose],
  );

  function select(id: Id) {
    onSelect(id);
    setIsMobileMenuOpen(false);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <ModalShell
      onClose={onClose}
      labelledBy={titleId}
      maxWidth={MODAL_MAX_WIDTH}
      isFullScreenOnMobile
      hasCloseButton={false}
    >
      <SettingsModalContext.Provider value={contextValue}>
        <div className="flex min-h-0 w-full flex-1 sm:h-[min(720px,90vh)] sm:flex-none">
          {hasMenu ? (
            <SettingsSidebar
              menuTitle={menuTitle}
              menuSubtitle={menuSubtitle}
              groups={groups}
              activeId={activeId}
              onSelect={select}
              dangerAction={dangerAction}
            />
          ) : null}

          <main className="flex min-w-0 flex-1 flex-col">
            {isMobileMenuOpen ? (
              <SettingsMobileMenu
                title={mobileMenuTitle}
                onClose={onClose}
                header={mobileMenuHeader}
                groups={groups}
                dangerAction={dangerAction}
                onSelect={select}
              />
            ) : null}

            <div
              className={cn(
                "relative min-h-0 flex-1 flex-col sm:flex",
                isMobileMenuOpen ? "hidden" : "flex",
              )}
            >
              {children}
            </div>
          </main>
        </div>
        {dialogs}
      </SettingsModalContext.Provider>
    </ModalShell>,
    document.body,
  );
}
