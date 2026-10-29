"use client";

import { type ServerSummary } from "@discordia/client-shared";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/cn";

import { useServerSettingsForm } from "@/components/servers/hooks/useServerSettingsForm";
import {
  SECTION_TITLES,
  type SettingsSection,
  visibleSections,
} from "@/components/servers/utils/settingsSections";
import { DeleteServerModal } from "../DeleteServerModal";
import { ServerProfileForm } from "./ServerProfileForm";
import { SettingsMobileMenu } from "./SettingsMobileMenu";
import { SettingsSidebar } from "./SettingsSidebar";
import { WordFilterSection } from "./WordFilterSection";

const TITLE_ID = "server-settings-title";
const SETTINGS_MODAL_WIDTH = 660;

type MobileView = "menu" | "section";

interface ServerSettingsModalProps {
  server: ServerSummary;
  isOwner: boolean;
  canManageServer: boolean;
  canManageMessages: boolean;
  onClose: () => void;
  onUpdated: (server: ServerSummary) => void;
  onDeleted: () => void;
}

export function ServerSettingsModal({
  server,
  isOwner,
  canManageServer,
  canManageMessages,
  onClose,
  onUpdated,
  onDeleted,
}: ServerSettingsModalProps) {
  // El formulario vive acá y no en la sección para que lo editado sobreviva
  // a pasar a otra sección y volver.
  const form = useServerSettingsForm({ server, onUpdated });
  const sections = visibleSections({ canManageServer, canManageMessages });
  const [section, setSection] = useState<SettingsSection>(
    canManageServer ? "profile" : "words",
  );
  const [mobileView, setMobileView] = useState<MobileView>("menu");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  function openSectionOnMobile(target: SettingsSection) {
    setSection(target);
    setMobileView("section");
  }

  return (
    <>
      <ModalShell
        onClose={onClose}
        labelledBy={TITLE_ID}
        maxWidth={SETTINGS_MODAL_WIDTH}
        isFullScreenOnMobile
      >
        <div className="flex min-h-0 flex-1 flex-col sm:max-h-[95dvh] sm:flex-row">
          <div className="border-line flex h-16 shrink-0 items-center gap-2 border-b px-4 pr-14 sm:hidden">
            {mobileView === "section" ? (
              <button
                type="button"
                onClick={() => setMobileView("menu")}
                aria-label="Volver a configuración"
                className="bg-surface-input text-content-muted flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl"
              >
                <ChevronLeft size={18} />
              </button>
            ) : null}
            <p className="text-content font-display truncate text-lg font-bold">
              {mobileView === "menu"
                ? "Configuración del servidor"
                : SECTION_TITLES[section]}
            </p>
          </div>

          {mobileView === "menu" ? (
            <SettingsMobileMenu
              server={server}
              sections={sections}
              canDelete={isOwner}
              onSelect={openSectionOnMobile}
              onDelete={() => setIsDeleteModalOpen(true)}
            />
          ) : null}

          <SettingsSidebar
            serverName={server.name}
            sections={sections}
            activeSection={section}
            canDelete={isOwner}
            onSelect={setSection}
            onDelete={() => setIsDeleteModalOpen(true)}
          />

          <div
            className={cn(
              "min-h-0 min-w-0 flex-1 flex-col sm:flex",
              mobileView === "section" ? "flex" : "hidden",
            )}
          >
            {section === "words" ? (
              <WordFilterSection serverId={server.id} titleId={TITLE_ID} />
            ) : (
              <ServerProfileForm
                form={form}
                serverName={server.name}
                titleId={TITLE_ID}
                onCancel={onClose}
              />
            )}
          </div>
        </div>
      </ModalShell>

      {isDeleteModalOpen ? (
        <DeleteServerModal
          serverId={server.id}
          serverName={server.name}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleted={onDeleted}
        />
      ) : null}
    </>
  );
}
