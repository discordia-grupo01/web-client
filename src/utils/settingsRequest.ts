import type { AccountSettingsSection } from "@/components/settings/AccountSettingsModal";
import { OPEN_SETTINGS_STORAGE_KEY } from "@/lib/constants";

const SECTIONS: readonly AccountSettingsSection[] = [
  "appearance",
  "notifications",
  "security",
  "premium",
  "subscriptions",
  "points",
  "boosts",
  "transactions",
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

const OPEN_SETTINGS_EVENT = "discordia:open-settings";

export function openSettingsSection(section: AccountSettingsSection): void {
  window.dispatchEvent(
    new CustomEvent<AccountSettingsSection>(OPEN_SETTINGS_EVENT, {
      detail: section,
    }),
  );
}

export function onSettingsSectionOpened(
  listener: (section: AccountSettingsSection) => void,
): () => void {
  function handle(event: Event) {
    const section = (event as CustomEvent<unknown>).detail;
    if (typeof section === "string" && isSection(section)) listener(section);
  }
  window.addEventListener(OPEN_SETTINGS_EVENT, handle);
  return () => window.removeEventListener(OPEN_SETTINGS_EVENT, handle);
}
