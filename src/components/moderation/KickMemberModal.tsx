"use client";

import {
  KICK_CONFIRM_LABEL,
  KICK_MEMBER_CONSEQUENCES,
  KICK_MEMBER_SUBTITLE,
  KICK_MEMBER_TITLE,
  kickSuccessNotice,
} from "@discordia/client-shared";
import { Check, UserX } from "lucide-react";
import { useState } from "react";

import { BanModalHeader } from "@/components/bans/BanModalHeader";
import type { BanTarget } from "@/components/bans/BanMemberModal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { kickMemberRequest } from "@/services/moderation/client";

const TITLE_ID = "kick-member-modal-title";

interface KickMemberModalProps {
  serverId: string;
  target: BanTarget;
  onClose: () => void;
  /** Se dispara apenas el back confirma la expulsion (el modal sigue abierto). */
  onKicked: () => void;
}

/**
 * Confirmacion de expulsion (#59). Jerarquia (CA2) y permiso (CA3) los decide
 * el back y el motivo se muestra tal cual en el `FormAlert`.
 */
export function KickMemberModal({
  serverId,
  target,
  onClose,
  onKicked,
}: KickMemberModalProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKicked, setIsKicked] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await kickMemberRequest(serverId, target.userId);
    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    setIsKicked(true);
    onKicked();
  }

  return (
    <ModalShell onClose={onClose} maxWidth={480} labelledBy={TITLE_ID}>
      <BanModalHeader
        titleId={TITLE_ID}
        title={KICK_MEMBER_TITLE}
        subtitle={KICK_MEMBER_SUBTITLE}
        icon={UserX}
      />

      <div className="space-y-4 px-5 py-5 sm:px-7">
        {isKicked ? (
          <>
            <p
              role="status"
              className="bg-success/10 text-success flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
            >
              <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{kickSuccessNotice(target.name)}</span>
            </p>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <div className="bg-surface-raised flex items-center gap-3 rounded-xl p-3">
              <Avatar
                name={target.name}
                src={target.avatarSrc}
                size={40}
                className="rounded-full"
              />
              <p className="font-display text-content min-w-0 truncate font-semibold">
                {target.name}
              </p>
            </div>

            <FormAlert message={errorMessage} />

            <p className="text-content-muted text-sm leading-relaxed">
              {KICK_MEMBER_CONSEQUENCES}
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => void handleConfirm()}
                isLoading={isSubmitting}
                className="sm:w-auto"
              >
                {KICK_CONFIRM_LABEL}
              </Button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
