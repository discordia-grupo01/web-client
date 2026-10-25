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

/** CA 3: la busqueda no encontro nada. */
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

/** Esqueletos mientras llega una pagina. */
export function MessageSearchSkeleton() {
  return (
    <ul aria-hidden="true" className="space-y-2">
      {[0, 1, 2, 3].map((item) => (
        <li
          key={item}
          className="border-line bg-surface animate-pulse rounded-lg border p-3"
        >
          <div className="bg-surface-raised mb-3 h-3 w-20 rounded" />
          <div className="flex gap-3">
            <div className="bg-surface-raised size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-surface-raised h-3 w-1/3 rounded" />
              <div className="bg-surface-raised h-3 w-full rounded" />
              <div className="bg-surface-raised h-3 w-2/3 rounded" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
