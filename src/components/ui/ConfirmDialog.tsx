"use client";

import type { LucideIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

interface ConfirmDialogProps {
  icon: LucideIcon;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  icon: Icon,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();

  return (
    <ModalShell onClose={onCancel} maxWidth={420} labelledBy={titleId}>
      <div className="flex flex-col items-center gap-5 px-7 py-8 text-center">
        <div className="bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl">
          <Icon size={28} />
        </div>
        <div>
          <h2
            id={titleId}
            className="font-display text-content mb-2 text-xl font-bold"
          >
            {title}
          </h2>
          <p className="text-content-muted text-sm leading-relaxed">{body}</p>
        </div>
        <div className="flex w-full gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
