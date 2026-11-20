"use client";

import {
  BILLING_COPY,
  BILLING_SECTION_LABELS,
  BILLING_SECTIONS,
  type BillingSection,
  isBillingSection,
  type TwoFactorStatus,
} from "@discordia/client-shared";

import { Activity, Bell, LogOut, Moon, Shield } from "lucide-react";
import { useState, type ReactNode } from "react";

import { BillingSettings } from "@/components/billing/BillingSettings";
import { BoostsSectionIcon } from "@/components/boosts/icons/BoostsSectionIcon";
import {
  DiscordiaPointIcon,
  DiscordiaPremiumIcon,
} from "@/components/billing/icons/DiscordiaIcons";
import { PlatformStatusSettings } from "@/components/platform-status/PlatformStatusSettings";
import { LogoutConfirmModal } from "@/components/profile/LogoutConfirmModal";
import { TwoFactorPanel } from "@/components/security/TwoFactorPanel";
import { SettingsModal } from "@/components/ui/settings/SettingsModal";
import type {
  SettingsNavGroup,
  SettingsNavItem,
} from "@/components/ui/settings/settingsNav";
import { SECURITY_TITLE } from "@/components/security/securityCopy";

import { AppearanceSettings } from "./AppearanceSettings";
import { PushSettings } from "./PushSettings";
import { SecuritySettings } from "./SecuritySettings";

export type AccountSettingsSection =
  "appearance" | "notifications" | "security" | "status" | BillingSection;

type SectionItem = SettingsNavItem<AccountSettingsSection>;

const ACCOUNT_SECTIONS: SectionItem[] = [
  {
    id: "appearance",
    label: "Apariencia",
    description: "Tema de la aplicación",
    icon: ({ size }) => <Moon size={size} />,
  },
  {
    id: "notifications",
    label: "Notificaciones",
    description: "Avisos push",
    icon: ({ size }) => <Bell size={size} />,
  },
  {
    id: "security",
    label: SECURITY_TITLE,
    description: "Acceso y verificación",
    icon: ({ size }) => <Shield size={size} />,
  },
];

const BILLING_ICONS: Record<
  BillingSection,
  (props: { size?: number }) => ReactNode
> = {
  premium: DiscordiaPremiumIcon,
  subscriptions: DiscordiaPremiumIcon,
  points: DiscordiaPointIcon,
  boosts: BoostsSectionIcon,
  transactions: DiscordiaPointIcon,
};

function isPremiumSection(id: AccountSettingsSection): boolean {
  return isBillingSection(id) && id !== "boosts";
}

const BILLING_ITEMS: SectionItem[] = BILLING_SECTIONS.map((id) => {
  const Icon = BILLING_ICONS[id];
  return {
    id,
    ...BILLING_SECTION_LABELS[id],
    tone:
      id === "boosts" ? "boost" : isPremiumSection(id) ? "premium" : undefined,
    icon: ({ size, active }) =>
      id === "boosts" ? (
        <BoostsSectionIcon size={size} onAccent={active} />
      ) : active ? (
        <span className="bg-boost-ink -m-1 flex size-[26px] shrink-0 items-center justify-center rounded-md">
          <Icon size={size} />
        </span>
      ) : (
        <Icon size={size} />
      ),
  };
});

const PLATFORM_SECTIONS: SectionItem[] = [
  {
    id: "status",
    label: "Estado de la plataforma",
    description: "Servicios e incidentes",
    icon: ({ size }) => <Activity size={size} />,
  },
];

const SECTION_GROUPS: SettingsNavGroup<AccountSettingsSection>[] = [
  { label: "Mi cuenta", items: ACCOUNT_SECTIONS },
  { label: BILLING_COPY.groupTitle, items: BILLING_ITEMS },
  { label: "Plataforma", items: PLATFORM_SECTIONS },
];

interface AccountSettingsModalProps {
  onClose: () => void;
  /** Abre directo en una sección (por ejemplo, al volver de Mercado Pago). */
  initialSection?: AccountSettingsSection;
}

export function AccountSettingsModal({
  onClose,
  initialSection,
}: AccountSettingsModalProps) {
  const [section, setSection] = useState<AccountSettingsSection>(
    initialSection ?? "appearance",
  );
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] =
    useState<TwoFactorStatus | null>(null);

  function selectSection(next: AccountSettingsSection) {
    setSection(next);
    setTwoFactorStatus(null);
  }

  return (
    <SettingsModal
      menuTitle="Configuración"
      mobileMenuTitle="Configuración"
      groups={SECTION_GROUPS}
      activeId={section}
      onSelect={selectSection}
      startOnMenu={!initialSection}
      dangerAction={{
        label: "Cerrar sesión",
        icon: LogOut,
        onClick: () => setIsLogoutOpen(true),
      }}
      onClose={onClose}
      dialogs={
        isLogoutOpen ? (
          <LogoutConfirmModal onClose={() => setIsLogoutOpen(false)} />
        ) : null
      }
    >
      {section === "appearance" ? (
        <AppearanceSettings />
      ) : section === "notifications" ? (
        <PushSettings />
      ) : section === "status" ? (
        <PlatformStatusSettings />
      ) : isBillingSection(section) ? (
        <BillingSettings tab={section} onNavigate={selectSection} />
      ) : twoFactorStatus ? (
        <TwoFactorPanel
          initialStatus={twoFactorStatus}
          onBack={() => setTwoFactorStatus(null)}
        />
      ) : (
        <SecuritySettings onOpenTwoFactor={setTwoFactorStatus} />
      )}
    </SettingsModal>
  );
}
