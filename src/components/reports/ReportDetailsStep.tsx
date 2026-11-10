"use client";

import {
  isReportDetailRequired,
  REPORT_CANCEL_ACTION,
  REPORT_DETAIL_LABEL,
  REPORT_DETAIL_OPTIONAL_HINT,
  REPORT_DETAIL_PLACEHOLDER,
  REPORT_SUBMIT_ACTION,
  type ReportCategory,
  reportAudienceNotice,
  reportDetailMaxLength,
} from "@discordia/client-shared";
import type { FormEvent, ReactNode } from "react";

import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";
import { Button } from "@/components/ui/Button";
import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FormAlert } from "@/components/ui/FormAlert";

const DETAIL_ID = "report-detail";

interface ReportDetailsStepProps {
  preview: ReactNode;
  category: ReportCategory;
  serverName: string;
  detail: string;
  detailError?: string;
  errorMessage: string;
  isSubmitting: boolean;
  onDetailChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ReportDetailsStep({
  preview,
  category,
  serverName,
  detail,
  detailError,
  errorMessage,
  isSubmitting,
  onDetailChange,
  onSubmit,
  onCancel,
}: ReportDetailsStepProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 overflow-y-auto px-5 pb-5 sm:px-7"
    >
      {preview}

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label
            htmlFor={DETAIL_ID}
            className="text-content-muted text-xs font-bold tracking-wider uppercase"
          >
            {REPORT_DETAIL_LABEL}
            {isReportDetailRequired(category) ? null : (
              <>
                {" "}
                <span className="font-normal normal-case">
                  {REPORT_DETAIL_OPTIONAL_HINT}
                </span>
              </>
            )}
          </label>
          <CharacterCounter
            length={[...detail.trim()].length}
            max={reportDetailMaxLength(category)}
          />
        </div>
        <AutoGrowTextarea
          id={DETAIL_ID}
          value={detail}
          maxHeight={160}
          autoFocus
          onChange={(event) => onDetailChange(event.target.value)}
          placeholder={REPORT_DETAIL_PLACEHOLDER}
          aria-invalid={detailError ? true : undefined}
          className="bg-surface-input text-content placeholder:text-content-subtle focus:border-accent border-line min-h-[5.5rem] w-full rounded-xl border p-3 text-sm outline-none"
        />
        {detailError ? (
          <p className="text-danger mt-1.5 text-xs">{detailError}</p>
        ) : null}
      </div>

      <p className="text-content-subtle text-xs">
        {reportAudienceNotice(serverName)}
      </p>

      <FormAlert message={errorMessage} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="sm:w-auto"
        >
          {REPORT_CANCEL_ACTION}
        </Button>
        <Button
          type="submit"
          variant="danger"
          isLoading={isSubmitting}
          className="sm:w-auto"
        >
          {REPORT_SUBMIT_ACTION}
        </Button>
      </div>
    </form>
  );
}
