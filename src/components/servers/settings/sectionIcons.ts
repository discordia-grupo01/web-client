import { Ban, FileText, Flag, type LucideIcon, Pen } from "lucide-react";

import { BoostActionIcon } from "@/components/boosts/BoostActionIcon";
import type { SettingsSection } from "@/components/servers/utils/settingsSections";

export const SECTION_ICONS: Record<
  SettingsSection,
  LucideIcon | typeof BoostActionIcon
> = {
  profile: Pen,
  boosts: BoostActionIcon,
  words: Ban,
  reports: Flag,
  audit: FileText,
};
