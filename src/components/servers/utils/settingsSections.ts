import {
  BANS_SECTION_SUBTITLE,
  BANS_SECTION_TITLE,
  BOOSTS_SECTION_SUBTITLE,
  BOOSTS_SECTION_TITLE,
  EMOJIS_SECTION_SUBTITLE,
  EMOJIS_SECTION_TITLE,
  MODERATION_AUDIT_DESCRIPTION,
  MODERATION_AUDIT_TITLE,
  REPORTS_DESCRIPTION,
  REPORTS_TITLE,
  ROLES_SECTION_SUBTITLE,
  ROLES_SECTION_TITLE,
  WORD_FILTER_TITLE,
} from "@discordia/client-shared";

export type SettingsSection =
  | "profile"
  | "boosts"
  | "emojis"
  | "roles"
  | "bans"
  | "words"
  | "reports"
  | "audit";

export const SECTION_TITLES: Record<SettingsSection, string> = {
  profile: "Perfil del servidor",
  boosts: BOOSTS_SECTION_TITLE,
  emojis: EMOJIS_SECTION_TITLE,
  roles: ROLES_SECTION_TITLE,
  bans: BANS_SECTION_TITLE,
  words: WORD_FILTER_TITLE,
  reports: REPORTS_TITLE,
  audit: MODERATION_AUDIT_TITLE,
};

export const SECTION_DESCRIPTIONS: Record<SettingsSection, string> = {
  profile: "Banner, ícono y nombre",
  boosts: BOOSTS_SECTION_SUBTITLE,
  emojis: EMOJIS_SECTION_SUBTITLE,
  roles: ROLES_SECTION_SUBTITLE,
  bans: BANS_SECTION_SUBTITLE,
  words: "Mensajes que no se pueden enviar",
  reports: REPORTS_DESCRIPTION,
  audit: MODERATION_AUDIT_DESCRIPTION,
};

/**
 * Las secciones que cualquier miembro ve, sin permisos: Boosts (el nivel del
 * servidor) y Emojis (la lista y los lugares; subir y borrar se chequea
 * adentro).
 */
const OPEN_SECTIONS: SettingsSection[] = ["boosts", "emojis"];

export function visibleSections({
  canManageServer,
  canManageMessages,
  canManageRoles = false,
  canBanMembers = false,
  canReviewReports,
}: {
  canManageServer: boolean;
  canManageMessages: boolean;
  canManageRoles?: boolean;
  canBanMembers?: boolean;
  canReviewReports: boolean;
}): SettingsSection[] {
  const sections: SettingsSection[] = [];
  if (canManageServer) sections.push("profile");
  sections.push("boosts", "emojis");
  if (canManageRoles) sections.push("roles");
  if (canBanMembers) sections.push("bans");
  if (canManageMessages) sections.push("words");
  if (canReviewReports) sections.push("reports", "audit");
  return sections;
}

/**
 * La sección con la que abre el modal: la pedida si se ve; si no, reportes
 * pendientes o la primera que se gestiona. Boosts y Emojis quedan para quien no
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
  return (
    sections.find((section) => !OPEN_SECTIONS.includes(section)) ??
    sections[0] ??
    "boosts"
  );
}
