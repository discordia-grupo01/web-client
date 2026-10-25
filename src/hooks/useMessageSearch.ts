"use client";

import {
  fetchMessageSearchPages,
  INITIAL_MESSAGE_SEARCH_STATE,
  isMessageSearchEmpty,
  type MessageSearchQuery,
  type MessageSearchState,
  messageSearchPageCount,
  messageSearchPageLoaded,
  messageSearchResults,
  normalizeMessageSearchQuery,
  requestMessageSearchPage,
  startMessageSearch,
} from "@discordia/client-shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { searchMessagesRequest } from "@/services/messages/client";

/**
 * Busqueda de mensajes de un servidor con paginador numerado. La logica de
 * paginas vive en `client-shared` (`chat/message-search`); aca solo se guarda
 * el estado y se piden las paginas al BFF.
 */
export function useMessageSearch(serverId: string) {
  const [state, setState] = useState<MessageSearchState>(
    INITIAL_MESSAGE_SEARCH_STATE,
  );
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const load = useCallback(
    (next: MessageSearchState) => {
      stateRef.current = next;
      setState(next);
      if (next.status !== "loading") return;
      void fetchMessageSearchPages(
        next,
        (query, before) => searchMessagesRequest(serverId, query, before),
        (searchId, pageNumber, result) =>
          setState((prev) =>
            messageSearchPageLoaded(prev, searchId, pageNumber, result),
          ),
      );
    },
    [serverId],
  );

  const search = useCallback(
    (query: MessageSearchQuery) =>
      load(
        startMessageSearch(
          stateRef.current,
          normalizeMessageSearchQuery(query),
        ),
      ),
    [load],
  );

  const goToPage = useCallback(
    (page: number) => load(requestMessageSearchPage(stateRef.current, page)),
    [load],
  );

  const retry = useCallback(() => {
    const current = stateRef.current;
    if (!current.query) return;
    if (current.pages.length === 0) search(current.query);
    else goToPage(current.targetPage);
  }, [search, goToPage]);

  const reset = useCallback(
    () =>
      load({
        ...INITIAL_MESSAGE_SEARCH_STATE,
        searchId: stateRef.current.searchId + 1,
      }),
    [load],
  );

  return useMemo(
    () => ({
      state,
      results: messageSearchResults(state),
      pageCount: messageSearchPageCount(state),
      isEmpty: isMessageSearchEmpty(state),
      search,
      goToPage,
      retry,
      reset,
    }),
    [state, search, goToPage, retry, reset],
  );
}

export type MessageSearch = ReturnType<typeof useMessageSearch>;
