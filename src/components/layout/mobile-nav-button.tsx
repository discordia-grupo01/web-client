"use client";

import { Menu } from "lucide-react";

import { IconButton } from "@/components/ui/IconButton";

import { useMobilePanels } from "./mobile-panels-context";

export function MobileNavButton() {
  const { openNav } = useMobilePanels();

  return (
    <div className="shrink-0 md:hidden">
      <IconButton icon={Menu} label="Abrir menú" onClick={openNav} />
    </div>
  );
}
