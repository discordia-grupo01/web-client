"use client";

import {
  type BoostSectionTab,
  pendingReportsLabel,
  type Role,
  serverBoostCount,
  serverBoostLevel,
  type ServerSummary,
} from "@discordia/client-shared";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import { type BanTarget } from "@/components/bans/BanMemberModal";
import { BansPanel } from "@/components/bans/BansPanel";
import { ServerBoostsSection } from "@/components/boosts/ServerBoostsSection";
import { ServerEmojisSection } from "@/components/emojis/ServerEmojisSection";
import { ModerationAuditSection } from "@/components/moderation-audit/ModerationAuditSection";
import { ReportsBadge } from "@/components/reports/ReportsBadge";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { RolesPanel } from "@/components/roles/RolesPanel";
import { BoostsSectionIcon } from "@/components/boosts/icons/BoostsSectionIcon";
import { Avatar } from "@/components/ui/Avatar";
import { SettingsModal } from "@/components/ui/settings/SettingsModal";
import type { SettingsNavGroup } from "@/components/ui/settings/settingsNav";
import { serverIconSrc } from "@/utils/image-urls";

import { useServerSettingsForm } from "@/components/servers/hooks/useServerSettingsForm";
import {
  initialSection,
  SECTION_DESCRIPTIONS,
  SECTION_GROUPS,
  SECTION_TITLES,
  type SettingsSection,
  visibleSections,
} from "@/components/servers/utils/settingsSections";
import { DeleteServerModal } from "../DeleteServerModal";
import { SECTION_ICONS } from "./sectionIcons";
import { ServerProfileForm } from "./ServerProfileForm";
import { VanityUrlField } from "./vanity/VanityUrlField";
import { WordFilterSection } from "./WordFilterSection";

type MobileView = "menu" | "section";

interface ServerSettingsModalProps {
  server: ServerSummary;
  isOwner: boolean;
  canManageServer: boolean;
  canManageMessages: boolean;
  canManageRoles?: boolean;
  canBanMembers?: boolean;
  canReviewReports: boolean;
  pendingReports: number;
  currentUserId: string | null;
  myRoles?: Role[];
  /** La sección con la que abre, si se entra desde un atajo (Boosts, Emojis). */
  openAt?: SettingsSection;
  openBoostsTab?: BoostSectionTab;
  onClose: () => void;
  /** "Ir a comprar puntos" de Boosts: cierra esto y abre Facturación. */
  onBuyPoints: () => void;
  onGoToMessage: (channelId: string, messageId: string) => void;
  onOpenProfile: (userId: string) => void;
  onBanMember?: (target: BanTarget) => void;
  onPermissionsChanged?: () => void;
  bansVersion?: number;
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
  canManageRoles = false,
  canBanMembers = false,
  canReviewReports,
  pendingReports,
  currentUserId,
  myRoles = [],
  openAt,
  openBoostsTab = "boost",
  onClose,
  onBuyPoints,
  onGoToMessage,
  onOpenProfile,
  onBanMember,
  onPermissionsChanged,
  bansVersion = 0,
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
    canManageRoles,
    canBanMembers,
    canReviewReports,
  });
  const [section, setSection] = useState<SettingsSection>(() =>
    initialSection(sections, {
      requested: openAt,
      hasPendingReports: canReviewReports && pendingReports > 0,
    }),
  );
  const reportsLabel = pendingReportsLabel(pendingReports, server.name);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [boostsTab, setBoostsTab] = useState<BoostSectionTab>(openBoostsTab);

  const groups: SettingsNavGroup<SettingsSection>[] = SECTION_GROUPS.map(
    (group) => ({
      label: group.label,
      items: group.sections
        .filter((id) => sections.includes(id))
        .map((id) => {
          const Icon = SECTION_ICONS[id];
          return {
            id,
            label: SECTION_TITLES[id],
            description: SECTION_DESCRIPTIONS[id],
            tone: id === "boosts" ? ("boost" as const) : undefined,
            icon: ({ size, active }: { size: number; active: boolean }) =>
              id === "boosts" ? (
                <BoostsSectionIcon size={size} onAccent={active} />
              ) : (
                <Icon size={size} />
              ),
            badge:
              id === "reports" && pendingReports > 0 ? (
                <ReportsBadge count={pendingReports} label={reportsLabel} />
              ) : undefined,
          };
        }),
    }),
  ).filter((group) => group.items.length > 0);

  function handleClose() {
    onClose();
    onPermissionsChanged?.();
  }

  function selectSection(target: SettingsSection) {
    setBoostsTab("boost");
    setSection(target);
  }

  function openBoostsAt(tab: BoostSectionTab) {
    selectSection("boosts");
    setBoostsTab(tab);
  }

  return (
    <SettingsModal
      menuTitle="Configuración"
      menuSubtitle={server.name}
      mobileMenuTitle="Configuración del servidor"
      mobileMenuHeader={
        <div className="flex flex-col items-center pt-3 pb-1">
          <Avatar
            name={server.name}
            src={serverIconSrc(server)}
            size={80}
            className="rounded-3xl"
          />
          <p className="text-content font-display mt-3 max-w-full truncate text-lg font-bold">
            {server.name}
          </p>
        </div>
      }
      groups={groups}
      activeId={section}
      onSelect={selectSection}
      startOnMenu={!openAt}
      dangerAction={
        isOwner
          ? {
              label: "Eliminar servidor",
              description: "Esta acción no se puede deshacer",
              icon: Trash2,
              onClick: () => setIsDeleteModalOpen(true),
            }
          : undefined
      }
      onClose={handleClose}
      dialogs={
        isDeleteModalOpen ? (
          <DeleteServerModal
            serverId={server.id}
            serverName={server.name}
            onClose={() => setIsDeleteModalOpen(false)}
            onDeleted={onDeleted}
          />
        ) : null
      }
    >
      {section === "reports" ? (
        <ReportsSection
          serverId={server.id}
          ownerId={server.owner_id}
          currentUserId={currentUserId}
          channels={server.channels}
          onGoToMessage={onGoToMessage}
          onOpenProfile={onOpenProfile}
          onPendingChanged={onPendingReportsChanged}
          onMembersChanged={onMembersChanged}
        />
      ) : section === "boosts" ? (
        <ServerBoostsSection
          server={server}
          initialTab={boostsTab}
          onBuyPoints={onBuyPoints}
        />
      ) : section === "audit" ? (
        <ModerationAuditSection serverId={server.id} />
      ) : section === "emojis" ? (
        <ServerEmojisSection
          server={server}
          canManageServer={canManageServer}
        />
      ) : section === "roles" ? (
        <RolesPanel
          serverId={server.id}
          serverName={server.name}
          isOwner={isOwner}
          myRoles={myRoles}
        />
      ) : section === "bans" ? (
        <BansPanel
          key={bansVersion}
          serverId={server.id}
          ownerId={server.owner_id}
          currentUserId={currentUserId}
          onOpenProfile={onOpenProfile}
          onBanMember={onBanMember ?? (() => {})}
        />
      ) : section === "words" ? (
        <WordFilterSection serverId={server.id} />
      ) : (
        <ServerProfileForm
          form={form}
          serverName={server.name}
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
    </SettingsModal>
  );
}
