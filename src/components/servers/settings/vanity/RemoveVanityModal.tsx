"use client";

import {
  displayInviteLink,
  vanityInviteLink,
  VANITY_REMOVE_COPY,
  vanityRemoveImpact,
} from "@discordia/client-shared";
import { useId } from "react";

import { appOrigin } from "@/components/invites/VanityLinkText";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";

interface RemoveVanityModalProps {
  code: string;
  pending: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function RemoveVanityModal({
  code,
  pending,
  error,
  onConfirm,
  onClose,
}: RemoveVanityModalProps) {
  const titleId = useId();
  const link = displayInviteLink(vanityInviteLink(code, appOrigin()));

  return (
    <ModalShell
      onClose={pending ? () => undefined : onClose}
      labelledBy={titleId}
      maxWidth={400}
    >
      <div className="flex flex-col gap-5 px-7 py-8">
        <div>
          <h2
            id={titleId}
            className="font-display text-content mb-1 text-xl font-bold"
          >
            {VANITY_REMOVE_COPY.title}
          </h2>
          <p className="text-content-muted text-sm leading-relaxed break-words">
            {vanityRemoveImpact(link)}
          </p>
        </div>
        <FormAlert message={error || undefined} />
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={onClose}
          >
            {VANITY_REMOVE_COPY.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={pending}
            onClick={onConfirm}
          >
            {VANITY_REMOVE_COPY.confirm}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
