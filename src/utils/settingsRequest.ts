import type { AccountSettingsSection } from "@/components/settings/AccountSettingsModal";
import { OPEN_SETTINGS_STORAGE_KEY } from "@/lib/constants";

const SECTIONS: readonly AccountSettingsSection[] = [
  "appearance",
  "notifications",
  "security",
  "billing",
  "status",
];

function isSection(value: string | null): value is AccountSettingsSection {
  return SECTIONS.includes(value as AccountSettingsSection);
}

export function requestSettingsSection(section: AccountSettingsSection): void {
  try {
    sessionStorage.setItem(OPEN_SETTINGS_STORAGE_KEY, section);
  } catch {}
}

export function takeRequestedSettingsSection(): AccountSettingsSection | null {
  try {
    const value = sessionStorage.getItem(OPEN_SETTINGS_STORAGE_KEY);
    sessionStorage.removeItem(OPEN_SETTINGS_STORAGE_KEY);
    return isSection(value) ? value : null;
  } catch {
    return null;
  }
}
