import { Ban, FileText, Flag, type LucideIcon, Pen, Smile } from "lucide-react";

import { BoostsSectionIcon } from "@/components/boosts/icons/BoostsSectionIcon";
import type { SettingsSection } from "@/components/servers/utils/settingsSections";

export const SECTION_ICONS: Record<
  SettingsSection,
  LucideIcon | typeof BoostsSectionIcon
> = {
  profile: Pen,
  boosts: BoostsSectionIcon,
  emojis: Smile,
  words: Ban,
  reports: Flag,
  audit: FileText,
};
