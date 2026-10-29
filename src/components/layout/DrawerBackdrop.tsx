"use client";

import { useMobilePanels } from "@/contexts/MobilePanelsContext";
import { cn } from "@/lib/cn";

export function DrawerBackdrop() {
  const { openPanel, close } = useMobilePanels();
  if (!openPanel) return null;

  return (
    <button
      type="button"
      aria-label="Cerrar panel"
      onClick={close}
      className={cn(
        "fixed inset-0 z-30 cursor-default bg-black/55",
        openPanel === "nav" ? "md:hidden" : "lg:hidden",
      )}
    />
  );
}
