"use client";

import {
  pendingReportsLabel,
  type ServerSummary,
} from "@discordia/client-shared";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

import { ReportsSection } from "@/components/reports/ReportsSection";
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
const REPORTS_MODAL_WIDTH = 780;

type MobileView = "menu" | "section";

interface ServerSettingsModalProps {
  server: ServerSummary;
  isOwner: boolean;
  canManageServer: boolean;
  canManageMessages: boolean;
  canReviewReports: boolean;
  pendingReports: number;
  currentUserId: string | null;
  onClose: () => void;
  onGoToMessage: (channelId: string, messageId: string) => void;
  onOpenProfile: (userId: string) => void;
  onPendingReportsChanged: () => void;
  onMembersChanged: () => void;
  onUpdated: (server: ServerSummary) => void;
  onDeleted: () => void;
}

export function ServerSettingsModal({
  server,
  isOwner,
  canManageServer,
  canManageMessages,
  canReviewReports,
  pendingReports,
  currentUserId,
  onClose,
  onGoToMessage,
  onOpenProfile,
  onPendingReportsChanged,
  onMembersChanged,
  onUpdated,
  onDeleted,
}: ServerSettingsModalProps) {
  // El formulario vive acá y no en la sección para que lo editado sobreviva
  // a pasar a otra sección y volver.
  const form = useServerSettingsForm({ server, onUpdated });
  const sections = visibleSections({
    canManageServer,
    canManageMessages,
    canReviewReports,
  });
  const [section, setSection] = useState<SettingsSection>(() =>
    canReviewReports && pendingReports > 0
      ? "reports"
      : canManageServer
        ? "profile"
        : "words",
  );
  const reportsLabel = pendingReportsLabel(pendingReports, server.name);
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
        maxWidth={
          section === "reports" ? REPORTS_MODAL_WIDTH : SETTINGS_MODAL_WIDTH
        }
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
              pendingReports={pendingReports}
              pendingReportsLabel={reportsLabel}
              onSelect={openSectionOnMobile}
              onDelete={() => setIsDeleteModalOpen(true)}
            />
          ) : null}

          <SettingsSidebar
            serverName={server.name}
            sections={sections}
            activeSection={section}
            canDelete={isOwner}
            pendingReports={pendingReports}
            pendingReportsLabel={reportsLabel}
            onSelect={setSection}
            onDelete={() => setIsDeleteModalOpen(true)}
          />

          <div
            className={cn(
              "min-h-0 min-w-0 flex-1 flex-col sm:flex",
              mobileView === "section" ? "flex" : "hidden",
            )}
          >
            {section === "reports" ? (
              <ReportsSection
                serverId={server.id}
                ownerId={server.owner_id}
                currentUserId={currentUserId}
                channels={server.channels}
                titleId={TITLE_ID}
                onGoToMessage={onGoToMessage}
                onOpenProfile={onOpenProfile}
                onPendingChanged={onPendingReportsChanged}
                onMembersChanged={onMembersChanged}
              />
            ) : section === "words" ? (
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
