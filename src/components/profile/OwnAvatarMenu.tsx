"use client";

import {
  CHANGE_AVATAR_LABEL,
  REMOVE_AVATAR_LABEL,
} from "@discordia/client-shared";

import { Camera, Trash2 } from "lucide-react";
import { useEffect } from "react";

interface OwnAvatarMenuProps {
  isRemoveDisabled: boolean;
  onPickNew: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export function OwnAvatarMenu({
  isRemoveDisabled,
  onPickNew,
  onRemove,
  onClose,
}: OwnAvatarMenuProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-10 cursor-default"
      />
      <div
        role="menu"
        className="bg-surface-modal border-line absolute top-full left-6 z-20 mt-1 w-56 rounded-xl border p-1.5 shadow-xl"
      >
        <button
          type="button"
          role="menuitem"
          onClick={onPickNew}
          autoFocus
          className="text-content hover:bg-surface-input flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
        >
          <Camera size={16} />
          {CHANGE_AVATAR_LABEL}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={onRemove}
          disabled={isRemoveDisabled}
          className="text-danger hover:bg-danger/10 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          <Trash2 size={16} />
          {REMOVE_AVATAR_LABEL}
        </button>
      </div>
    </>
  );
}
