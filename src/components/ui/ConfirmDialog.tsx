"use client";

import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

interface ConfirmDialogBaseProps {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

type ConfirmDialogProps = ConfirmDialogBaseProps &
  ({ icon: LucideIcon; media?: never } | { icon?: never; media: ReactNode });

export function ConfirmDialog({
  icon: Icon,
  media,
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
          {media ?? (Icon ? <Icon size={28} /> : null)}
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
