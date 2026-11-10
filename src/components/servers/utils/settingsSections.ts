import {
  REPORTS_DESCRIPTION,
  REPORTS_TITLE,
  WORD_FILTER_TITLE,
} from "@discordia/client-shared";

export type SettingsSection = "profile" | "words" | "reports";

export const SECTION_TITLES: Record<SettingsSection, string> = {
  profile: "Perfil del servidor",
  words: WORD_FILTER_TITLE,
  reports: REPORTS_TITLE,
};

export const SECTION_DESCRIPTIONS: Record<SettingsSection, string> = {
  profile: "Banner, ícono y nombre",
  words: "Mensajes que no se pueden enviar",
  reports: REPORTS_DESCRIPTION,
};

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
  if (canManageMessages) sections.push("words");
  if (canReviewReports) sections.push("reports");
  return sections;
}
