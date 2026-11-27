"use client";

import { CheckCircle2, type LucideIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

interface SuccessDialogProps {
  title: string;
  body: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onClose: () => void;
}

export function SuccessDialog({
  title,
  body,
  icon: Icon = CheckCircle2,
  actionLabel = "Cerrar",
  onClose,
}: SuccessDialogProps) {
  const titleId = useId();

  return (
    <ModalShell onClose={onClose} maxWidth={420} labelledBy={titleId}>
      <div
        role="status"
        className="flex flex-col items-center gap-5 px-7 py-8 text-center"
      >
        <div className="bg-success/15 text-success flex size-16 shrink-0 items-center justify-center rounded-2xl">
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
        <Button type="button" onClick={onClose} autoFocus>
          {actionLabel}
        </Button>
      </div>
    </ModalShell>
  );
}
