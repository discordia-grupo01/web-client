"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MobilePanel = "nav" | "members";

interface MobilePanelsValue {
  openPanel: MobilePanel | null;
  openNav: () => void;
  openMembers: () => void;
  close: () => void;
}

const MobilePanelsContext = createContext<MobilePanelsValue | null>(null);

export function MobilePanelsProvider({ children }: { children: ReactNode }) {
  const [openPanel, setOpenPanel] = useState<MobilePanel | null>(null);

  useEffect(() => {
    if (!openPanel) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPanel(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openPanel]);

  const value = useMemo(
    () => ({
      openPanel,
      openNav: () => setOpenPanel("nav"),
      openMembers: () => setOpenPanel("members"),
      close: () => setOpenPanel(null),
    }),
    [openPanel],
  );

  return (
    <MobilePanelsContext.Provider value={value}>
      {children}
    </MobilePanelsContext.Provider>
  );
}

export function useMobilePanels(): MobilePanelsValue {
  const context = useContext(MobilePanelsContext);
  if (!context) {
    throw new Error(
      "useMobilePanels debe usarse dentro de <MobilePanelsProvider>",
    );
  }
  return context;
}
