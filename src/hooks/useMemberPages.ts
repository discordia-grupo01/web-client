"use client";

import {
  DEFAULT_PAGE_SIZE,
  type ListMembersResult,
  type Member,
  type MemberPageQuery,
  pageCountOf,
  pageRange,
  SEARCH_DEBOUNCE_MS,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "./useDebouncedValue";
import { useProfileFallback } from "./useProfileFallback";

export type MemberPageFetcher = (
  query: MemberPageQuery,
) => Promise<ListMembersResult>;

interface UseMemberPagesOptions {
  /**
   * Pide una pagina al back. Tiene que ser estable (`useCallback`): si cambia,
   * se entiende que es otra lista (otro servidor, otro rol) y vuelve a la
   * primera pagina.
   */
  fetchPage: MemberPageFetcher;
  /** Lo que escribio el usuario; se manda al back con debounce. */
  search: string;
  /** No pide nada hasta que la lista se muestra. */
  enabled?: boolean;
  pageSize?: number;
}

/**
 * Una lista de miembros paginada y filtrada por nombre EN EL BACK, de a una
 * pagina por vez (a diferencia de `usePagination`, que pagina en memoria).
 * Mientras llega la pagina nueva se sigue mostrando la anterior.
 */
export function useMemberPages({
  fetchPage,
  search,
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseMemberPagesOptions) {
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [page, setPageState] = useState(1);
  const [loaded, setLoaded] = useState<Member[] | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const lastRequest = useRef(0);

  // Otra lista u otra busqueda vuelve a la primera pagina. Se corrige en el
  // render (no en un efecto) para no pedir antes la pagina vieja.
  const [listKey, setListKey] = useState({
    fetchPage,
    search: debouncedSearch,
  });
  if (listKey.fetchPage !== fetchPage || listKey.search !== debouncedSearch) {
    if (listKey.fetchPage !== fetchPage) setLoaded(null);
    setListKey({ fetchPage, search: debouncedSearch });
    setPageState(1);
  }

  useEffect(() => {
    if (!enabled) return;
    const request = ++lastRequest.current;
    setIsLoading(true);
    fetchPage({
      search: debouncedSearch,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }).then((result) => {
      if (request !== lastRequest.current) return;
      setIsLoading(false);
      if (!result.ok) {
        setErrorMessage(result.message);
        setLoaded((current) => current ?? []);
        return;
      }
      setErrorMessage("");
      setLoaded(result.members);
      setTotal(result.total);
    });
  }, [enabled, fetchPage, debouncedSearch, page, pageSize, reloadKey]);

  const pageCount = pageCountOf(total, pageSize);
  const setPage = useCallback(
    (next: number) =>
      setPageState(Math.min(Math.max(1, next), pageCountOf(total, pageSize))),
    [total, pageSize],
  );
  /** Vuelve a pedir la pagina actual, por ejemplo despues de asignar un rol. */
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    /** `null` hasta que llega la primera pagina. */
    members: useProfileFallback(loaded),
    total,
    page,
    pageCount,
    range: pageRange(page, pageSize, total),
    setPage,
    isLoading,
    /** El usuario sigue escribiendo: todavia no se busco lo que se ve. */
    isSearchPending: search !== debouncedSearch,
    isSearching: debouncedSearch.trim() !== "",
    errorMessage,
    reload,
  };
}
