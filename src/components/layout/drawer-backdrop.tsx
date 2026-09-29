"use client";

import { useMobilePanels } from "./mobile-panels-context";

export function DrawerBackdrop() {
  const { openPanel, close } = useMobilePanels();
  if (!openPanel) return null;

  return (
    <button
      type="button"
      aria-label="Cerrar panel"
      onClick={close}
      className="fixed inset-0 z-30 cursor-default bg-black/55 md:hidden"
    />
  );
}
