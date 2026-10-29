import { WORD_FILTER_TITLE } from "@discordia/client-shared";

export type SettingsSection = "profile" | "words";

export const SECTION_TITLES: Record<SettingsSection, string> = {
  profile: "Perfil del servidor",
  words: WORD_FILTER_TITLE,
};

export const SECTION_DESCRIPTIONS: Record<SettingsSection, string> = {
  profile: "Banner, ícono y nombre",
  words: "Mensajes que no se pueden enviar",
};

export function visibleSections({
  canManageServer,
  canManageMessages,
}: {
  canManageServer: boolean;
  canManageMessages: boolean;
}): SettingsSection[] {
  const sections: SettingsSection[] = [];
  if (canManageServer) sections.push("profile");
  if (canManageMessages) sections.push("words");
  return sections;
}
