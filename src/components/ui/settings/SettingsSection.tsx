import type { ReactNode } from "react";

import { SettingsHeading } from "./SettingsHeading";

interface SettingsSectionProps {
  description?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function SettingsSection({
  description,
  actions,
  toolbar,
  footer,
  children,
}: SettingsSectionProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-6">
        <SettingsHeading description={description} actions={actions} />
        {toolbar}
        <div>{children}</div>
      </div>

      {footer}
    </div>
  );
}
