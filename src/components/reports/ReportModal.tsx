"use client";

import {
  REPORT_BACK_LABEL,
  REPORT_MESSAGE_LABEL,
  REPORT_SENT_NOTICE,
  REPORT_USER_LABEL,
  reportCategoriesFor,
} from "@discordia/client-shared";
import { Check, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

import { useReportForm } from "./hooks/useReportForm";
import { ReportCategoryStep } from "./ReportCategoryStep";
import { ReportDetailsStep } from "./ReportDetailsStep";
import type { ReportTarget } from "./reportTarget";
import { ReportTargetPreview } from "./ReportTargetPreview";

const TITLE_ID = "report-modal-title";

interface ReportModalProps {
  serverId: string;
  serverName: string;
  target: ReportTarget;
  onClose: () => void;
}

/** Reportar un mensaje o un usuario (#62): categoria, detalle y enviar. */
export function ReportModal({
  serverId,
  serverName,
  target,
  onClose,
}: ReportModalProps) {
  const form = useReportForm(serverId, target);
  const category = form.step === "details" ? form.category : null;
  const title = category
    ? category.label
    : target.kind === "message"
      ? REPORT_MESSAGE_LABEL
      : REPORT_USER_LABEL;

  const preview =
    target.kind === "message" ? (
      <ReportTargetPreview
        kind="message"
        message={target.message}
        author={target.author}
      />
    ) : (
      <ReportTargetPreview
        kind="user"
        name={target.name}
        avatarSrc={target.avatarSrc}
      />
    );

  return (
    <ModalShell onClose={onClose} maxWidth={480} labelledBy={TITLE_ID}>
      <div className="flex shrink-0 items-center gap-2 px-5 pt-6 pr-16 pb-3 sm:px-7">
        {category ? (
          <button
            type="button"
            onClick={form.backToCategories}
            aria-label={REPORT_BACK_LABEL}
            className="text-content-muted hover:text-content -ml-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg"
          >
            <ChevronLeft size={18} />
          </button>
        ) : null}
        <h2
          id={TITLE_ID}
          className="font-display text-content truncate text-xl font-bold"
        >
          {title}
        </h2>
      </div>

      {form.step === "sent" ? (
        <div className="space-y-4 px-5 pb-6 sm:px-7">
          <p
            role="status"
            className="bg-success/10 text-success flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          >
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{REPORT_SENT_NOTICE}</span>
          </p>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      ) : category ? (
        <ReportDetailsStep
          preview={preview}
          category={category}
          serverName={serverName}
          detail={form.detail}
          detailError={form.detailError}
          errorMessage={form.errorMessage}
          isSubmitting={form.isSubmitting}
          onDetailChange={form.setDetail}
          onSubmit={() => void form.submit()}
          onCancel={onClose}
        />
      ) : (
        <ReportCategoryStep
          preview={preview}
          categories={reportCategoriesFor(target.kind)}
          onChoose={form.chooseCategory}
        />
      )}
    </ModalShell>
  );
}
