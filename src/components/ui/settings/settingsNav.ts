import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface SettingsNavItem<Id extends string> {
  id: Id;
  label: string;
  description: string;
  icon: (props: { size: number; active: boolean }) => ReactNode;
  tone?: "premium" | "boost";
  badge?: ReactNode;
}

export interface SettingsNavGroup<Id extends string> {
  label: string;
  items: SettingsNavItem<Id>[];
}

export interface SettingsDangerAction {
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
}
