"use client";

import {
  MESSAGE_SEARCH_HINT,
  MESSAGE_SEARCH_HINT_TITLE,
  MESSAGE_SEARCH_NO_RESULTS_HINT,
  MESSAGE_SEARCH_NO_RESULTS_TITLE,
  RETRY_LABEL,
} from "@discordia/client-shared";
import { AlertTriangle, Search, SearchX } from "lucide-react";
import type { ReactNode } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function StatusBlock({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="bg-surface-raised text-content-subtle mb-3 flex size-12 items-center justify-center rounded-full">
        {icon}
      </div>
      <p className="font-display text-content text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

/** Antes de la primera busqueda. */
export function MessageSearchHint() {
  return (
    <StatusBlock icon={<Search size={22} />} title={MESSAGE_SEARCH_HINT_TITLE}>
      <p className="text-content-muted mt-1 text-xs">{MESSAGE_SEARCH_HINT}</p>
    </StatusBlock>
  );
}

export function MessageSearchEmpty() {
  return (
    <StatusBlock
      icon={<SearchX size={22} />}
      title={MESSAGE_SEARCH_NO_RESULTS_TITLE}
    >
      <p className="text-content-muted mt-1 text-xs">
        {MESSAGE_SEARCH_NO_RESULTS_HINT}
      </p>
    </StatusBlock>
  );
}

export function MessageSearchError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert">
      <StatusBlock icon={<AlertTriangle size={22} />} title={message}>
        <button
          type="button"
          onClick={onRetry}
          className="text-accent-strong hover:text-content mt-2 cursor-pointer text-xs font-semibold"
        >
          {RETRY_LABEL}
        </button>
      </StatusBlock>
    </div>
  );
}

export function MessageSearchLoading() {
  return <LoadingSpinner label="Buscando mensajes" />;
}
