"use client";

import {
  BAN_CONFIRM_LABEL,
  BAN_MEMBER_CONSEQUENCES,
  BAN_MEMBER_SUBTITLE,
  BAN_MEMBER_TITLE,
  BAN_REASON_LABEL,
  BAN_REASON_MAX_LENGTH,
  BAN_REASON_PLACEHOLDER,
  banSuccessNotice,
  validateBanReason,
} from "@discordia/client-shared";

import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";
import { Button } from "@/components/ui/Button";
import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { Avatar } from "@/components/ui/Avatar";
import { banMemberRequest } from "@/services/bans/client";

import { BanModalHeader } from "./BanModalHeader";

const TITLE_ID = "ban-member-modal-title";

/** A quien se va a banear, con lo necesario para mostrarlo en la confirmacion. */
export interface BanTarget {
  userId: string;
  name: string;
  avatarSrc: string | null;
}

interface BanMemberModalProps {
  serverId: string;
  userId: string;
  name: string;
  avatarSrc: string | null;
  onClose: () => void;
  /** Se dispara apenas el back confirma el baneo (el modal sigue abierto). */
  onBanned: () => void;
}

/**
 * Confirmacion de baneo con motivo opcional. Los rechazos por jerarquia o
 * falta de permiso los decide el back y se muestran tal cual llegan en el
 * `FormAlert`.
 */
export function BanMemberModal({
  serverId,
  userId,
  name,
  avatarSrc,
  onClose,
  onBanned,
}: BanMemberModalProps) {
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  const reasonError = validateBanReason(reason);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (reasonError) return;
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await banMemberRequest(serverId, { userId, reason });
    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.fieldErrors?.reason ?? result.message);
      return;
    }
    setIsBanned(true);
    onBanned();
  }

  return (
    <ModalShell onClose={onClose} maxWidth={480} labelledBy={TITLE_ID}>
      <BanModalHeader
        titleId={TITLE_ID}
        title={BAN_MEMBER_TITLE}
        subtitle={BAN_MEMBER_SUBTITLE}
      />

      {isBanned ? (
        <div className="space-y-5 px-5 py-6 sm:px-7">
          <p
            role="status"
            className="bg-success/10 text-success flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          >
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{banSuccessNotice(name)}</span>
          </p>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7"
        >
          <div className="bg-surface-raised flex items-center gap-3 rounded-xl p-3">
            <Avatar
              name={name}
              src={avatarSrc}
              size={40}
              className="rounded-full"
            />
            <p className="font-display text-content min-w-0 truncate font-semibold">
              {name}
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="ban-reason"
                className="text-content-subtle text-xs font-semibold tracking-wider uppercase"
              >
                {BAN_REASON_LABEL}{" "}
                <span className="font-normal normal-case">(opcional)</span>
              </label>
              <CharacterCounter
                length={[...reason].length}
                max={BAN_REASON_MAX_LENGTH}
              />
            </div>
            <AutoGrowTextarea
              id="ban-reason"
              value={reason}
              maxHeight={160}
              onChange={(event) => {
                setReason(event.target.value);
                setErrorMessage("");
              }}
              placeholder={BAN_REASON_PLACEHOLDER}
              aria-invalid={reasonError ? true : undefined}
              className="bg-surface-input text-content placeholder:text-content-subtle focus:border-accent border-line min-h-[5.5rem] w-full rounded-xl border p-3 text-sm outline-none"
            />
            {reasonError ? (
              <p className="text-danger mt-1.5 text-xs">{reasonError}</p>
            ) : null}
          </div>

          <FormAlert message={errorMessage} />

          <p className="text-content-muted text-sm leading-relaxed">
            {BAN_MEMBER_CONSEQUENCES}
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
              type="submit"
              variant="danger"
              isLoading={isSubmitting}
              disabled={isSubmitting || Boolean(reasonError)}
              className="sm:w-auto"
            >
              {BAN_CONFIRM_LABEL}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
