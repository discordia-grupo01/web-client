"use client";

import {
  buildReportReason,
  type CreateReportInput,
  type ReportCategory,
  validateReportDetail,
} from "@discordia/client-shared";
import { useState } from "react";

import { createReportRequest } from "@/services/reports/client";

import type { ReportTarget } from "../reportTarget";

export type ReportStep = "category" | "details" | "sent";

function inputFor(target: ReportTarget, reason: string): CreateReportInput {
  if (target.kind === "message") {
    return {
      kind: "message",
      channelId: target.message.channel_id,
      messageId: target.message.id,
      reason,
    };
  }
  return { kind: "user", userId: target.userId, reason };
}

/** Paso 1 elige la categoria, paso 2 suma el detalle y envia. */
export function useReportForm(serverId: string, target: ReportTarget) {
  const [step, setStep] = useState<ReportStep>("category");
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [detail, setDetailState] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const detailError = category
    ? validateReportDetail(category, detail)
    : undefined;

  function chooseCategory(next: ReportCategory) {
    setCategory(next);
    setErrorMessage("");
    setHasTriedSubmit(false);
    setStep("details");
  }

  function backToCategories() {
    setErrorMessage("");
    setStep("category");
  }

  function setDetail(value: string) {
    setDetailState(value);
    setErrorMessage("");
  }

  async function submit() {
    setHasTriedSubmit(true);
    if (!category || detailError || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await createReportRequest(
      serverId,
      inputFor(target, buildReportReason(category, detail)),
    );
    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    setStep("sent");
  }

  return {
    step,
    category,
    detail,
    detailError:
      hasTriedSubmit || detail.trim() !== "" ? detailError : undefined,
    errorMessage,
    isSubmitting,
    chooseCategory,
    backToCategories,
    setDetail,
    submit,
  };
}

export type ReportForm = ReturnType<typeof useReportForm>;
