"use client";

import {
  BILLING_COPY,
  type PaymentKind,
  PAYMENT_OUTCOME_TONE,
  PAYMENT_RETURN_SECTION,
  type PaymentOutcomeTone,
  paymentOutcomeCopy,
  type PaymentReturnParams,
} from "@discordia/client-shared";

import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { requestSettingsSection } from "@/utils/settingsRequest";

import { usePaymentReturn } from "./hooks/usePaymentReturn";

const TONE_STYLE: Record<PaymentOutcomeTone, string> = {
  progress: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  danger: "bg-danger/15 text-danger",
};

const TONE_ICON = {
  progress: Loader2,
  success: CheckCircle2,
  warning: AlertCircle,
  danger: XCircle,
} as const;

function backToBilling(kind: PaymentKind | undefined) {
  requestSettingsSection(PAYMENT_RETURN_SECTION[kind ?? "points"]);
  window.location.href = ROUTES.home;
}

export function PaymentReturnView({
  params,
}: {
  params: PaymentReturnParams | null;
}) {
  const payment = usePaymentReturn(params);
  const { outcome, done } = payment.progress;
  const tone = PAYMENT_OUTCOME_TONE[outcome];
  const Icon = TONE_ICON[tone];
  const copy = paymentOutcomeCopy(outcome, {
    points: payment.purchase?.points,
    balance: payment.balance ?? undefined,
    statusDetail: payment.purchase?.status_detail,
    premiumUntil: payment.premium?.premium_until,
  });

  return (
    <main
      className="flex min-h-dvh items-center justify-center p-4"
      style={{ background: "var(--bg-chat)" }}
    >
      <div
        className="border-line-strong flex w-full flex-col items-center gap-5 rounded-[20px] border px-7 py-9 text-center shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
        style={{ maxWidth: 440, background: "var(--bg-modal)" }}
      >
        <p className="text-content-subtle text-xs font-semibold tracking-wider uppercase">
          {BILLING_COPY.resultTitle}
        </p>
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-2xl",
            TONE_STYLE[tone],
          )}
        >
          <Icon
            size={30}
            className={cn(tone === "progress" && "animate-spin")}
          />
        </div>
        <div aria-live="polite">
          <h1 className="font-display text-content mb-2 text-xl font-bold">
            {copy.title}
          </h1>
          <p className="text-content-muted text-sm leading-relaxed">
            {copy.description}
          </p>
        </div>

        <FormAlert message={payment.error ?? undefined} />

        <div className="flex w-full flex-col gap-3">
          {payment.error ? (
            <Button type="button" variant="secondary" onClick={payment.retry}>
              {BILLING_COPY.retry}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={done ? "primary" : "secondary"}
            onClick={() => backToBilling(params?.kind)}
          >
            {BILLING_COPY.backToBilling}
          </Button>
        </div>
      </div>
    </main>
  );
}
