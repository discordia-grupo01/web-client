"use client";

import {
  CHECKOUT_LEAVING_NOTICE,
  formatArsFromCents,
  formatPoints,
  PREMIUM_RENEWAL_NOTICE,
  validateEmail,
} from "@discordia/client-shared";

import { Star, Zap } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { TextField } from "@/components/ui/TextField";

import { BILLING_COPY } from "./billingCopy";

export type CheckoutItem =
  | { kind: "premium"; priceCents: number }
  | { kind: "points"; packageId: string; points: number; priceCents: number };

interface CheckoutConfirmModalProps {
  item: CheckoutItem;
  defaultEmail: string;
  pending: boolean;
  error: string | null;
  onConfirm: (payerEmail: string) => void;
  onClose: () => void;
}

export function CheckoutConfirmModal({
  item,
  defaultEmail,
  pending,
  error,
  onConfirm,
  onClose,
}: CheckoutConfirmModalProps) {
  const titleId = useId();
  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState<string>();
  const isPremium = item.kind === "premium";
  const Icon = isPremium ? Star : Zap;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (isPremium) {
      const invalid = validateEmail(email);
      setEmailError(invalid);
      if (invalid) return;
    }
    onConfirm(email.trim());
  }

  return (
    <ModalShell
      onClose={pending ? () => undefined : onClose}
      labelledBy={titleId}
      maxWidth={440}
    >
      <form onSubmit={submit} className="flex flex-col gap-5 px-7 py-8">
        <p className="text-content-subtle text-xs font-semibold tracking-wider uppercase">
          {pending
            ? BILLING_COPY.checkoutPreparing
            : BILLING_COPY.checkoutTitle}
        </p>

        <div className="flex items-center gap-4">
          <div className="bg-info/15 text-info flex size-14 shrink-0 items-center justify-center rounded-2xl">
            <Icon size={26} />
          </div>
          <div>
            <h2
              id={titleId}
              className="font-display text-content text-xl font-bold"
            >
              {isPremium
                ? BILLING_COPY.premiumTitle
                : formatPoints(item.points)}
            </h2>
            <p className="font-display text-content-muted text-lg font-semibold">
              {formatArsFromCents(item.priceCents)}
            </p>
          </div>
        </div>

        {isPremium ? (
          <p className="text-content-muted text-sm leading-relaxed">
            {PREMIUM_RENEWAL_NOTICE}
          </p>
        ) : null}

        {isPremium ? (
          <TextField
            label={BILLING_COPY.payerEmailLabel}
            type="email"
            autoComplete="email"
            value={email}
            disabled={pending}
            error={emailError}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError(undefined);
            }}
          />
        ) : null}

        <p className="bg-surface-input text-content-subtle rounded-xl p-3 text-xs leading-relaxed">
          {CHECKOUT_LEAVING_NOTICE}
        </p>

        <FormAlert message={error ?? undefined} />

        <Button type="submit" isLoading={pending}>
          {pending
            ? BILLING_COPY.checkoutPreparing
            : BILLING_COPY.checkoutContinue}
        </Button>
      </form>
    </ModalShell>
  );
}
