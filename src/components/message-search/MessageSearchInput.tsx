"use client";

import {
  MESSAGE_SEARCH_CLOSE,
  MESSAGE_SEARCH_LABEL,
  messageSearchPlaceholder,
} from "@discordia/client-shared";
import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { useMessageSearchContext } from "@/contexts/MessageSearchContext";

/**
 * Campo de busqueda: en pantallas anchas vive en el header, arriba de la
 * columna de resultados; en las angostas, arriba del drawer. Enter busca y abre
 * los resultados; la ✕ y Esc los cierran.
 */
export function MessageSearchInput() {
  const {
    serverName,
    draft,
    setDraft,
    submit,
    focusToken,
    isOpen,
    close,
    clear,
  } = useMessageSearchContext();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [focusToken]);

  return (
    <div className="bg-surface-input border-line focus-within:border-accent flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-2.5 transition-colors">
      <Search
        size={14}
        className="text-content-subtle shrink-0"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          } else if (event.key === "Escape") {
            // Sin esto el navegador vacia el campo y no coincidiria con los resultados.
            event.preventDefault();
            close();
          }
        }}
        placeholder={messageSearchPlaceholder(serverName)}
        aria-label={MESSAGE_SEARCH_LABEL}
        title={`${MESSAGE_SEARCH_LABEL} (Ctrl+K)`}
        autoComplete="off"
        className="text-content placeholder:text-content-subtle min-w-0 flex-1 border-none bg-transparent text-[13px] text-ellipsis outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {draft || isOpen ? (
        <button
          type="button"
          onClick={clear}
          aria-label={MESSAGE_SEARCH_CLOSE}
          className="text-content-subtle hover:text-content flex size-4 shrink-0 cursor-pointer items-center justify-center"
        >
          <X size={12} />
        </button>
      ) : null}
    </div>
  );
}
