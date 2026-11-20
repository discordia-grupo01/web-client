"use client";

import {
  DEFAULT_PAGE_SIZE,
  type MemberPageQuery,
  pageCountOf,
  pageRange,
  SEARCH_DEBOUNCE_MS,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "./useDebouncedValue";
import { type ProfiledUser, useProfileFallback } from "./useProfileFallback";

export type PagedResult<T> =
  { ok: true; items: T[]; total: number } | { ok: false; message: string };

export type PageFetcher<T> = (
  query: MemberPageQuery,
) => Promise<PagedResult<T>>;

interface UsePagedListOptions<T> {
  /**
   * Pide una pagina al back. Tiene que ser estable (`useCallback`): si cambia,
   * se entiende que es otra lista (otro servidor, otro rol) y vuelve a la
   * primera pagina.
   */
  fetchPage: PageFetcher<T>;
  /** Lo que escribio el usuario; se manda al back con debounce. */
  search: string;
  /** No pide nada hasta que la lista se muestra. */
  enabled?: boolean;
  pageSize?: number;
}

/**
 * Una lista de usuarios (miembros, baneados) paginada y filtrada por nombre EN
 * EL BACK, de a una pagina por vez. Mientras llega la pagina nueva se sigue
 * mostrando la anterior.
 */
export function usePagedList<T extends ProfiledUser>({
  fetchPage,
  search,
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
}: UsePagedListOptions<T>) {
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [page, setPageState] = useState(1);
  const [loaded, setLoaded] = useState<T[] | null>(null);
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
      setLoaded(result.items);
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
    items: useProfileFallback(loaded),
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
