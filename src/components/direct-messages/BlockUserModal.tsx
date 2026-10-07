"use client";

import {
  BLOCK_USER_BODY,
  BLOCK_USER_CANCEL_ACTION,
  BLOCK_USER_CONFIRM_ACTION,
  blockUserTitle,
  type BlockUserResult,
  UNBLOCK_USER_BODY,
  UNBLOCK_USER_CONFIRM_ACTION,
  unblockUserTitle,
} from "@discordia/client-shared";

import { Ban, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

interface BlockUserModalProps {
  userName: string;
  isBlocked: boolean;
  onConfirm: () => Promise<BlockUserResult>;
  onClose: () => void;
}

const TITLE_ID = "block-user-title";

export function BlockUserModal({
  userName,
  isBlocked,
  onConfirm,
  onClose,
}: BlockUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    const result = await onConfirm();
    setIsSubmitting(false);
    if (result.ok) onClose();
    else setError(result.message);
  }

  const Icon = isBlocked ? ShieldCheck : Ban;

  return (
    <ModalShell onClose={onClose} maxWidth={400} labelledBy={TITLE_ID}>
      <div className="flex flex-col items-center gap-5 px-7 py-8 text-center">
        <div
          className={
            isBlocked
              ? "bg-accent/15 text-accent flex size-16 shrink-0 items-center justify-center rounded-2xl"
              : "bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl"
          }
        >
          <Icon size={28} />
        </div>
        <div>
          <h2
            id={TITLE_ID}
            className="font-display text-content mb-2 text-xl font-bold"
          >
            {isBlocked ? unblockUserTitle(userName) : blockUserTitle(userName)}
          </h2>
          <p className="text-content-muted text-sm leading-relaxed">
            {isBlocked ? UNBLOCK_USER_BODY : BLOCK_USER_BODY}
          </p>
        </div>
        {error ? (
          <p
            role="alert"
            className="border-danger/30 bg-danger/10 text-danger w-full rounded-lg border px-3 py-2 text-sm"
          >
            {error}
          </p>
        ) : null}
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {BLOCK_USER_CANCEL_ACTION}
          </Button>
          <Button
            type="button"
            variant={isBlocked ? "primary" : "danger"}
            onClick={handleConfirm}
            isLoading={isSubmitting}
            autoFocus
          >
            {isBlocked
              ? UNBLOCK_USER_CONFIRM_ACTION
              : BLOCK_USER_CONFIRM_ACTION}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
