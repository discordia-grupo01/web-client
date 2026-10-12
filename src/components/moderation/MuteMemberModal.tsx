"use client";

import {
  BAN_REASON_MAX_LENGTH,
  MUTE_CONFIRM_LABEL,
  MUTE_DURATION_LABEL,
  MUTE_DURATIONS,
  MUTE_MEMBER_CONSEQUENCES,
  MUTE_MEMBER_SUBTITLE,
  MUTE_MEMBER_TITLE,
  MUTE_REASON_LABEL,
  MUTE_REASON_PLACEHOLDER,
  muteSuccessNotice,
  muteUntilFrom,
  validateBanReason,
} from "@discordia/client-shared";
import { Check, MicOff } from "lucide-react";
import { useState, type FormEvent } from "react";

import { BanModalHeader } from "@/components/bans/BanModalHeader";
import type { BanTarget } from "@/components/bans/BanMemberModal";
import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/cn";
import { muteMemberRequest } from "@/services/moderation/client";

const TITLE_ID = "mute-member-modal-title";
const DEFAULT_DURATION_ID = "1h";

interface MuteMemberModalProps {
  serverId: string;
  target: BanTarget;
  onClose: () => void;
  /** Se dispara apenas el back confirma el silencio (el modal sigue abierto). */
  onMuted: () => void;
}

/**
 * Silenciar por un tiempo (#60 CA1): se elige la duracion y, opcional, el
 * motivo. Al vencer, el back lo levanta solo (CA2).
 */
export function MuteMemberModal({
  serverId,
  target,
  onClose,
  onMuted,
}: MuteMemberModalProps) {
  const [durationId, setDurationId] = useState(DEFAULT_DURATION_ID);
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutedUntil, setMutedUntil] = useState<string | null>(null);

  const reasonError = validateBanReason(reason);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const duration = MUTE_DURATIONS.find((d) => d.id === durationId);
    if (!duration || reasonError) return;
    const untilAt = muteUntilFrom(duration);
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await muteMemberRequest(serverId, {
      userId: target.userId,
      untilAt,
      reason,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    setMutedUntil(untilAt);
    onMuted();
  }

  return (
    <ModalShell onClose={onClose} maxWidth={480} labelledBy={TITLE_ID}>
      <BanModalHeader
        titleId={TITLE_ID}
        title={MUTE_MEMBER_TITLE}
        subtitle={MUTE_MEMBER_SUBTITLE}
        icon={MicOff}
      />

      {mutedUntil ? (
        <div className="space-y-5 px-5 py-6 sm:px-7">
          <p
            role="status"
            className="bg-success/10 text-success flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          >
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{muteSuccessNotice(target.name, mutedUntil)}</span>
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
              name={target.name}
              src={target.avatarSrc}
              size={40}
              className="rounded-full"
            />
            <p className="font-display text-content min-w-0 truncate font-semibold">
              {target.name}
            </p>
          </div>

          <fieldset>
            <legend className="text-content-subtle mb-1.5 text-xs font-semibold tracking-wider uppercase">
              {MUTE_DURATION_LABEL}
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {MUTE_DURATIONS.map((duration) => {
                const isSelected = duration.id === durationId;
                return (
                  <label
                    key={duration.id}
                    className={cn(
                      "cursor-pointer rounded-xl border px-3 py-2 text-center text-sm transition-colors",
                      isSelected
                        ? "border-accent bg-accent/15 text-content font-semibold"
                        : "border-line bg-surface-input text-content-muted hover:border-line-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name="mute-duration"
                      value={duration.id}
                      checked={isSelected}
                      onChange={() => setDurationId(duration.id)}
                      className="sr-only"
                    />
                    {duration.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="mute-reason"
                className="text-content-subtle text-xs font-semibold tracking-wider uppercase"
              >
                {MUTE_REASON_LABEL}{" "}
                <span className="font-normal normal-case">(opcional)</span>
              </label>
              <CharacterCounter
                length={[...reason].length}
                max={BAN_REASON_MAX_LENGTH}
              />
            </div>
            <AutoGrowTextarea
              id="mute-reason"
              value={reason}
              maxHeight={120}
              onChange={(event) => {
                setReason(event.target.value);
                setErrorMessage("");
              }}
              placeholder={MUTE_REASON_PLACEHOLDER}
              aria-invalid={reasonError ? true : undefined}
              className="bg-surface-input text-content placeholder:text-content-subtle focus:border-accent border-line min-h-[4.5rem] w-full rounded-xl border p-3 text-sm outline-none"
            />
            {reasonError ? (
              <p className="text-danger mt-1.5 text-xs">{reasonError}</p>
            ) : null}
          </div>

          <FormAlert message={errorMessage} />

          <p className="text-content-muted text-sm leading-relaxed">
            {MUTE_MEMBER_CONSEQUENCES}
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
              {MUTE_CONFIRM_LABEL}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
