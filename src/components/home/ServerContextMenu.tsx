"use client";

import {
  MARK_SERVER_READ_LABEL,
  markServerReadLabel,
  serverOptionsLabel,
} from "@discordia/client-shared";

import { CheckCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

const MENU_WIDTH = 208;
const MENU_HEIGHT = 48;

interface ServerContextMenuProps {
  position: { x: number; y: number };
  serverName: string;
  canMarkRead: boolean;
  onMarkRead: () => void;
  onClose: () => void;
}

export function ServerContextMenu({
  position,
  serverName,
  canMarkRead,
  onMarkRead,
  onClose,
}: ServerContextMenuProps) {
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    itemRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onClose);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  const left = Math.max(
    8,
    Math.min(position.x, window.innerWidth - MENU_WIDTH - 8),
  );
  const top = Math.max(
    8,
    Math.min(position.y, window.innerHeight - MENU_HEIGHT - 8),
  );

  return createPortal(
    <>
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        onContextMenu={(event) => {
          event.preventDefault();
          onClose();
        }}
        className="fixed inset-0 z-40 cursor-default"
      />
      <div
        role="menu"
        aria-label={serverOptionsLabel(serverName)}
        className="bg-surface-raised border-line fixed z-50 overflow-hidden rounded-xl border py-1 shadow-2xl"
        style={{ left, top, width: MENU_WIDTH }}
      >
        <button
          ref={itemRef}
          type="button"
          role="menuitem"
          disabled={!canMarkRead}
          onClick={() => {
            onMarkRead();
            onClose();
          }}
          aria-label={markServerReadLabel(serverName)}
          className={cn(
            "text-content flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
            canMarkRead
              ? "hover:bg-surface-hover cursor-pointer"
              : "cursor-not-allowed opacity-50",
          )}
        >
          <CheckCheck size={14} className="shrink-0" />
          {MARK_SERVER_READ_LABEL}
        </button>
      </div>
    </>,
    document.body,
  );
}
