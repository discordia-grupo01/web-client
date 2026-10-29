import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const POSITION = {
  left: { anchor: "left-0", closed: "-translate-x-full" },
  afterRail: { anchor: "left-[72px]", closed: "-translate-x-[312px]" },
  right: { anchor: "right-0", closed: "translate-x-full" },
} as const;

const DOCKED = {
  md: "md:static md:z-auto md:translate-none",
  lg: "lg:static lg:z-auto lg:translate-none",
} as const;

interface SidePanelProps {
  position: keyof typeof POSITION;
  isOpen: boolean;
  dockFrom?: keyof typeof DOCKED;
  /** Fijo en el layout tambien en mobile, sin drawer. */
  isDocked?: boolean;
  className?: string;
  children: ReactNode;
}

export function SidePanel({
  position,
  isOpen,
  dockFrom = "md",
  isDocked = false,
  className,
  children,
}: SidePanelProps) {
  const { anchor, closed } = POSITION[position];

  return (
    <div
      className={cn(
        "flex shrink-0 transition-transform duration-300 ease-in-out",
        isDocked
          ? "static z-auto translate-none"
          : [
              "fixed inset-y-0 z-40",
              DOCKED[dockFrom],
              anchor,
              isOpen ? "translate-none" : closed,
            ],
        className,
      )}
    >
      {children}
    </div>
  );
}
