"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export interface SettingsSubPage {
  parent: string;
  title: string;
  onBack: () => void;
}

export interface SettingsHeadingInfo {
  titleId: string;
  title: ReactNode;
  onClose: () => void;
  back?: {
    label: string;
    onClick: () => void;
    isMobileOnly: boolean;
  };
}

interface SettingsModalContextValue {
  setSubPage: (page: SettingsSubPage | null) => void;
  heading: SettingsHeadingInfo;
}

export const SettingsModalContext =
  createContext<SettingsModalContextValue | null>(null);

export function useSettingsHeading(): SettingsHeadingInfo | null {
  return useContext(SettingsModalContext)?.heading ?? null;
}

/** Devuelve false fuera de un `SettingsModal`: ahí quien lo usa pone su propio botón de volver. */
export function useSettingsSubPage(page: SettingsSubPage | null): boolean {
  const context = useContext(SettingsModalContext);
  const onBackRef = useRef(page?.onBack);
  useEffect(() => {
    onBackRef.current = page?.onBack;
  });

  const isOpen = page !== null;
  const parent = page?.parent ?? "";
  const title = page?.title ?? "";

  // Depender del contexto entero haría un ciclo: cambia con cada título que registra este efecto.
  const setSubPage = context?.setSubPage;
  useEffect(() => {
    if (!setSubPage || !isOpen) return;
    setSubPage({
      parent,
      title,
      onBack: () => onBackRef.current?.(),
    });
    return () => setSubPage(null);
  }, [setSubPage, isOpen, parent, title]);

  return context !== null;
}
