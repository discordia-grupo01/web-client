import type { ReactNode } from "react";

export function SettingsFormFooter({ children }: { children: ReactNode }) {
  return (
    <div className="border-line flex shrink-0 items-center justify-end gap-3 border-t px-4 py-3 sm:px-8">
      {children}
    </div>
  );
}
