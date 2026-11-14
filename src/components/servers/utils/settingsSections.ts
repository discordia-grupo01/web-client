import {
  BOOSTS_SECTION_SUBTITLE,
  BOOSTS_SECTION_TITLE,
  MODERATION_AUDIT_DESCRIPTION,
  MODERATION_AUDIT_TITLE,
  REPORTS_DESCRIPTION,
  REPORTS_TITLE,
  WORD_FILTER_TITLE,
} from "@discordia/client-shared";

export type SettingsSection =
  "profile" | "boosts" | "words" | "reports" | "audit";

export const SECTION_TITLES: Record<SettingsSection, string> = {
  profile: "Perfil del servidor",
  boosts: BOOSTS_SECTION_TITLE,
  words: WORD_FILTER_TITLE,
  reports: REPORTS_TITLE,
  audit: MODERATION_AUDIT_TITLE,
};

export const SECTION_DESCRIPTIONS: Record<SettingsSection, string> = {
  profile: "Banner, ícono y nombre",
  boosts: BOOSTS_SECTION_SUBTITLE,
  words: "Mensajes que no se pueden enviar",
  reports: REPORTS_DESCRIPTION,
  audit: MODERATION_AUDIT_DESCRIPTION,
};

/** Boosts no pide permisos: cualquier miembro ve el nivel del servidor. */
export function visibleSections({
  canManageServer,
  canManageMessages,
  canReviewReports,
}: {
  canManageServer: boolean;
  canManageMessages: boolean;
  canReviewReports: boolean;
}): SettingsSection[] {
  const sections: SettingsSection[] = [];
  if (canManageServer) sections.push("profile");
  sections.push("boosts");
  if (canManageMessages) sections.push("words");
  if (canReviewReports) sections.push("reports", "audit");
  return sections;
}

/**
 * La sección con la que abre el modal: la pedida si se ve; si no, reportes
 * pendientes o la primera que se gestiona. Boosts queda para quien no
 * gestiona nada, o cuando se entra desde su ítem del menú.
 */
export function initialSection(
  sections: SettingsSection[],
  {
    requested,
    hasPendingReports,
  }: { requested?: SettingsSection; hasPendingReports: boolean },
): SettingsSection {
  if (requested && sections.includes(requested)) return requested;
  if (hasPendingReports && sections.includes("reports")) return "reports";
  return sections.find((section) => section !== "boosts") ?? "boosts";
}
