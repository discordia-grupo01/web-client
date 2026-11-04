"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ label, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 transition-opacity duration-300 starting:opacity-0"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="border-line-strong bg-surface-modal rounded-t-[22px] border-t px-4 pt-2.5 pb-7"
      >
        <div className="bg-line-strong mx-auto mb-4 h-1 w-9 rounded-xs" />
        {children}
      </div>
    </div>,
    document.body,
  );
}
