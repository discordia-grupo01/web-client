"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import {
  type SettingsHeadingInfo,
  useSettingsHeading,
} from "./SettingsModalContext";
import { ModalCloseButton } from "@/components/ui/ModalCloseButton";

interface SettingsHeadingProps {
  description?: ReactNode;
  actions?: ReactNode;
}

/**
 * Fuera de un `SettingsModal` no hay título: queda solo la descripción. En
 * celular el título lo dibuja `SettingsMobileTitleBar`, fijo arriba.
 */
export function SettingsHeading({
  description,
  actions,
}: SettingsHeadingProps) {
  const heading = useSettingsHeading();
  if (!heading && description == null && actions == null) return null;

  const hasBody = description != null || actions != null;

  return (
    <div className={cn("space-y-1.5", !hasBody && "hidden sm:block")}>
      {heading ? (
        <TitleRow heading={heading} titleId={heading.titleId} isDesktopOnly />
      ) : null}

      {description != null ? (
        <p className="text-content-muted text-sm leading-relaxed">
          {description}
        </p>
      ) : null}

      {actions != null ? (
        <div className="flex flex-wrap items-center gap-2 pt-3">{actions}</div>
      ) : null}
    </div>
  );
}

type TitleBarInfo = Pick<SettingsHeadingInfo, "title" | "onClose" | "back">;

export function SettingsMobileTitleBar({ heading }: { heading: TitleBarInfo }) {
  return (
    <div className="border-line shrink-0 border-b px-4 py-3 sm:hidden">
      <TitleRow heading={heading} />
    </div>
  );
}

interface TitleRowProps {
  heading: TitleBarInfo;
  /** Solo una de las dos filas lleva el id que nombra al diálogo. */
  titleId?: string;
  isDesktopOnly?: boolean;
}

function TitleRow({ heading, titleId, isDesktopOnly = false }: TitleRowProps) {
  const back = heading.back;
  const showsBack = back && !(isDesktopOnly && back.isMobileOnly);

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        isDesktopOnly && "hidden sm:flex",
      )}
    >
      {showsBack ? (
        <button
          type="button"
          onClick={back.onClick}
          aria-label={back.label}
          className="text-content-muted hover:bg-surface-hover hover:text-content -ml-2 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      ) : null}
      <h2
        id={titleId}
        className={cn(
          "text-content font-display flex min-w-0 flex-1 items-center gap-1.5 font-bold",
          isDesktopOnly ? "text-xl" : "text-[17px]",
        )}
      >
        <span className="truncate">{heading.title}</span>
      </h2>
      <SettingsCloseButton onClick={heading.onClose} />
    </div>
  );
}

export function SettingsCloseButton({ onClick }: { onClick: () => void }) {
  return <ModalCloseButton onClick={onClick} />;
}
