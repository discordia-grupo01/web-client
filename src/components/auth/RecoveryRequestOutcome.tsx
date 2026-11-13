"use client";

import {
  ACCOUNT_RECOVERY_PENDING_DESCRIPTION,
  ACCOUNT_RECOVERY_SENT_DESCRIPTION,
} from "@discordia/client-shared";

import { ArrowRight, Clock, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";

type RecoveryRequestOutcomeProps =
  | { status: "sent"; emailHint: string; onBack: () => void }
  | { status: "pending"; onBack: () => void };

export function RecoveryRequestOutcome(props: RecoveryRequestOutcomeProps) {
  const sent = props.status === "sent";

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={
          sent
            ? "bg-success/15 text-success mb-5 flex size-16 items-center justify-center rounded-2xl"
            : "bg-info/15 text-info mb-5 flex size-16 items-center justify-center rounded-2xl"
        }
      >
        {sent ? <MailCheck size={32} /> : <Clock size={32} />}
      </div>

      <h1 className="font-display text-content mb-2 text-2xl font-bold">
        {sent ? "Recibimos tu solicitud" : "Tu solicitud está en revisión"}
      </h1>
      <p className="text-content-muted mb-8 text-sm leading-relaxed">
        {props.status === "sent" ? (
          <>
            {ACCOUNT_RECOVERY_SENT_DESCRIPTION}{" "}
            <strong className="text-content">{props.emailHint}</strong>.
          </>
        ) : (
          ACCOUNT_RECOVERY_PENDING_DESCRIPTION
        )}
      </p>

      <Button type="button" onClick={props.onBack}>
        <span>Volver al inicio de sesión</span>
        <ArrowRight size={16} />
      </Button>
    </div>
  );
}
