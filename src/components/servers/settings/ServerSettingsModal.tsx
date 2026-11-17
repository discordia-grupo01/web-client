"use client";

import {
  type BoostSectionTab,
  pendingReportsLabel,
  serverBoostCount,
  serverBoostLevel,
  type ServerSummary,
} from "@discordia/client-shared";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

import { ServerBoostsSection } from "@/components/boosts/ServerBoostsSection";
import { ServerEmojisSection } from "@/components/emojis/ServerEmojisSection";
import { ModerationAuditSection } from "@/components/moderation-audit/ModerationAuditSection";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/cn";

import { useServerSettingsForm } from "@/components/servers/hooks/useServerSettingsForm";
import {
  initialSection,
  SECTION_TITLES,
  type SettingsSection,
  visibleSections,
} from "@/components/servers/utils/settingsSections";
import { DeleteServerModal } from "../DeleteServerModal";
import { ServerProfileForm } from "./ServerProfileForm";
import { SettingsMobileMenu } from "./SettingsMobileMenu";
import { SettingsSidebar } from "./SettingsSidebar";
import { VanityUrlField } from "./vanity/VanityUrlField";
import { WordFilterSection } from "./WordFilterSection";

const TITLE_ID = "server-settings-title";
const SETTINGS_MODAL_WIDTH = 880;

type MobileView = "menu" | "section";

interface ServerSettingsModalProps {
  server: ServerSummary;
  isOwner: boolean;
  canManageServer: boolean;
  canManageMessages: boolean;
  canReviewReports: boolean;
  pendingReports: number;
  currentUserId: string | null;
  /** La sección con la que abre, si se entra desde un atajo (Boosts, Emojis). */
  openAt?: SettingsSection;
  openBoostsTab?: BoostSectionTab;
  onClose: () => void;
  /** "Ir a comprar puntos" de Boosts: cierra esto y abre Facturación. */
  onBuyPoints: () => void;
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
  openAt,
  openBoostsTab = "boost",
  onClose,
  onBuyPoints,
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
    initialSection(sections, {
      requested: openAt,
      hasPendingReports: canReviewReports && pendingReports > 0,
    }),
  );
  const reportsLabel = pendingReportsLabel(pendingReports, server.name);
  // Con una sola sección (un miembro sin permisos) no hay menú que mostrar.
  const hasMenu = sections.length > 1;
  const [mobileView, setMobileView] = useState<MobileView>(
    hasMenu && !openAt ? "menu" : "section",
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [boostsTab, setBoostsTab] = useState<BoostSectionTab>(openBoostsTab);

  function selectSection(target: SettingsSection) {
    setBoostsTab("boost");
    setSection(target);
  }

  function openSectionOnMobile(target: SettingsSection) {
    selectSection(target);
    setMobileView("section");
  }

  function openBoostsAt(tab: BoostSectionTab) {
    openSectionOnMobile("boosts");
    setBoostsTab(tab);
  }

  return (
    <>
      <ModalShell
        onClose={onClose}
        labelledBy={TITLE_ID}
        maxWidth={SETTINGS_MODAL_WIDTH}
        isFullScreenOnMobile
      >
        <div className="flex min-h-0 flex-1 flex-col sm:h-[min(720px,85dvh)] sm:flex-none sm:flex-row">
          <div className="border-line flex h-16 shrink-0 items-center gap-2 border-b px-4 pr-14 sm:hidden">
            {mobileView === "section" && hasMenu ? (
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

          {hasMenu ? (
            <SettingsSidebar
              serverName={server.name}
              sections={sections}
              activeSection={section}
              canDelete={isOwner}
              pendingReports={pendingReports}
              pendingReportsLabel={reportsLabel}
              onSelect={selectSection}
              onDelete={() => setIsDeleteModalOpen(true)}
            />
          ) : null}

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
            ) : section === "boosts" ? (
              <ServerBoostsSection
                server={server}
                titleId={TITLE_ID}
                initialTab={boostsTab}
                onBuyPoints={onBuyPoints}
              />
            ) : section === "audit" ? (
              <ModerationAuditSection serverId={server.id} titleId={TITLE_ID} />
            ) : section === "emojis" ? (
              <ServerEmojisSection
                server={server}
                canManageServer={canManageServer}
                titleId={TITLE_ID}
              />
            ) : section === "words" ? (
              <WordFilterSection serverId={server.id} titleId={TITLE_ID} />
            ) : (
              <ServerProfileForm
                form={form}
                serverName={server.name}
                titleId={TITLE_ID}
                onCancel={onClose}
                onBoost={() => openBoostsAt("boost")}
                onShowBenefits={() => openBoostsAt("benefits")}
                vanityField={
                  <VanityUrlField
                    serverId={server.id}
                    serverName={server.name}
                    level={serverBoostLevel(server)}
                    boostCount={serverBoostCount(server)}
                    vanityCode={server.vanity_code ?? null}
                  />
                }
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
