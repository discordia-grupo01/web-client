"use client";

import {
  PRIVATE_CALL_ACCEPT,
  PRIVATE_CALL_CANCEL,
  PRIVATE_CALL_DECLINE,
  type PrivateCallPhase,
} from "@discordia/client-shared";

import { Phone, PhoneOff, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

interface PrivateCallRingingActionsProps {
  phase: PrivateCallPhase;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
}

export function PrivateCallRingingActions({
  phase,
  onAccept,
  onDecline,
  onCancel,
}: PrivateCallRingingActionsProps) {
  return (
    <div className="flex justify-center gap-3 px-4 pb-4">
      {phase === "incoming" ? (
        <>
          <RingingButton
            icon={PhoneOff}
            label={PRIVATE_CALL_DECLINE}
            tone="danger"
            onClick={onDecline}
          />
          <RingingButton
            icon={Phone}
            label={PRIVATE_CALL_ACCEPT}
            tone="success"
            onClick={onAccept}
          />
        </>
      ) : (
        <RingingButton
          icon={PhoneOff}
          label={PRIVATE_CALL_CANCEL}
          tone="danger"
          onClick={onCancel}
        />
      )}
    </div>
  );
}

function RingingButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone: "danger" | "success";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex min-w-24 cursor-pointer flex-col items-center gap-1 rounded-xl border px-6 py-2 transition-all active:scale-95",
        "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
        tone === "danger"
          ? "bg-danger/15 border-danger/30 text-danger hover:bg-danger/25"
          : "bg-success/15 border-success/30 text-success hover:bg-success/25",
      )}
    >
      <Icon size={20} />
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
