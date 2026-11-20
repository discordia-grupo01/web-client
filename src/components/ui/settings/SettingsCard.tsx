import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function SettingsCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface-raised border-line rounded-2xl border px-4 py-1 sm:px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
