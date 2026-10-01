import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const POSITION = {
  left: { anchor: "left-0", closed: "-translate-x-full" },
  afterRail: { anchor: "left-[72px]", closed: "-translate-x-[312px]" },
  right: { anchor: "right-0", closed: "translate-x-full" },
} as const;

interface SidePanelProps {
  position: keyof typeof POSITION;
  /** Solo aplica en mobile: en desktop el panel esta siempre en su lugar. */
  isOpen: boolean;
  className?: string;
  children: ReactNode;
}

export function SidePanel({
  position,
  isOpen,
  className,
  children,
}: SidePanelProps) {
  const { anchor, closed } = POSITION[position];

  return (
    <div
      className={cn(
        "fixed inset-y-0 z-40 flex shrink-0 transition-transform duration-300 ease-in-out",
        "md:static md:z-auto md:translate-none",
        anchor,
        isOpen ? "translate-none" : closed,
        className,
      )}
    >
      {children}
    </div>
  );
}
