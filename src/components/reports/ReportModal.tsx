"use client";

import {
  REPORT_BACK_LABEL,
  REPORT_MESSAGE_LABEL,
  REPORT_SENT_BODY,
  REPORT_SENT_TITLE,
  REPORT_USER_LABEL,
  reportCategoriesFor,
} from "@discordia/client-shared";
import { ChevronLeft } from "lucide-react";

import { ModalShell } from "@/components/ui/ModalShell";
import { SuccessDialog } from "@/components/ui/SuccessDialog";

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

  if (form.step === "sent") {
    return (
      <SuccessDialog
        title={REPORT_SENT_TITLE}
        body={REPORT_SENT_BODY}
        onClose={onClose}
      />
    );
  }

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

      {category ? (
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
