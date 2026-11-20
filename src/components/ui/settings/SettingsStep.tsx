"use client";

import type { ReactNode } from "react";

import { useSettingsSubPage } from "./SettingsModalContext";
import { SettingsSection } from "./SettingsSection";

interface SettingsStepProps {
  /** Solo se usa en la etiqueta de la flecha: "Volver a Seguridad". */
  parent: string;
  title: string;
  description?: ReactNode;
  onBack: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

export function SettingsStep({
  parent,
  title,
  description,
  onBack,
  footer,
  children,
}: SettingsStepProps) {
  useSettingsSubPage({ parent, title, onBack });
  return (
    <SettingsSection description={description} footer={footer}>
      {children}
    </SettingsSection>
  );
}
