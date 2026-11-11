"use client";

import {
  appendMembersPage,
  DEFAULT_PAGE_SIZE,
  type Member,
  SEARCH_DEBOUNCE_MS,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { type MemberPageFetcher } from "@/hooks/useMemberPages";
import { useProfileFallback } from "@/hooks/useProfileFallback";

interface UseMemberScrollOptions {
  /** Estable (`useCallback`): si cambia, la lista arranca de cero. */
  fetchPage: MemberPageFetcher;
  /** Lo que escribio el usuario; se busca en el back con debounce. */
  search?: string;
  pageSize?: number;
}

/**
 * Una lista de miembros que se va cargando de a paginas a medida que se
 * scrollea (scroll infinito). `loadMore` pide la siguiente si quedan y no hay
 * otra en vuelo, asi se puede llamar sin miedo cada vez que se llega al fondo.
 * Una busqueda nueva vuelve a la primera pagina, pero mientras llega se sigue
 * mostrando lo anterior.
 */
export function useMemberScroll({
  fetchPage,
  search = "",
  pageSize = DEFAULT_PAGE_SIZE,
}: UseMemberScrollOptions) {
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [loaded, setLoaded] = useState<Member[] | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const loadedCountRef = useRef(0);
  /** Cambia cada vez que la lista arranca de cero: descarta respuestas viejas. */
  const generation = useRef(0);
  const inFlight = useRef(false);

  const fetchFrom = useCallback(
    (offset: number) => {
      const current = generation.current;
      inFlight.current = true;
      if (offset > 0) setIsLoadingMore(true);
      fetchPage({ search: debouncedSearch, limit: pageSize, offset }).then(
        (result) => {
          if (current !== generation.current) return;
          inFlight.current = false;
          setIsLoadingMore(false);
          if (!result.ok) {
            setErrorMessage(result.message);
            setLoaded((prev) => prev ?? []);
            return;
          }
          setErrorMessage("");
          setTotal(result.total);
          setLoaded((prev) =>
            offset === 0
              ? result.members
              : appendMembersPage(prev ?? [], result.members),
          );
        },
      );
    },
    [fetchPage, debouncedSearch, pageSize],
  );

  /** Vuelve a cargar desde la primera pagina (ej. despues de un baneo). */
  const reload = useCallback(() => {
    generation.current += 1;
    inFlight.current = false;
    setIsLoadingMore(false);
    fetchFrom(0);
  }, [fetchFrom]);

  // Otra lista (otro servidor) arranca vacia; otra busqueda no, asi no
  // parpadea el "Cargando" con cada letra.
  const [listFetcher, setListFetcher] = useState(() => fetchPage);
  if (listFetcher !== fetchPage) {
    setListFetcher(() => fetchPage);
    setLoaded(null);
    setErrorMessage("");
  }

  useEffect(() => {
    reload();
  }, [reload]);

  const loadedCount = loaded?.length ?? 0;
  useEffect(() => {
    loadedCountRef.current = loadedCount;
  }, [loadedCount]);

  const refresh = useCallback(async () => {
    const current = generation.current;
    const wanted = Math.max(loadedCountRef.current, pageSize);
    let collected: Member[] = [];
    let latestTotal = 0;
    while (collected.length < wanted) {
      const result = await fetchPage({
        search: debouncedSearch,
        limit: pageSize,
        offset: collected.length,
      });
      if (current !== generation.current || !result.ok) return;
      collected = appendMembersPage(collected, result.members);
      latestTotal = result.total;
      if (result.members.length === 0 || collected.length >= result.total) {
        break;
      }
    }
    if (current !== generation.current) return;
    setLoaded(collected);
    setTotal(latestTotal);
  }, [fetchPage, debouncedSearch, pageSize]);
  // Un error no corta la lista: seguir scrolleando vuelve a intentar.
  const hasMore = loaded !== null && loadedCount < total;

  const loadMore = useCallback(() => {
    if (!hasMore || inFlight.current) return;
    fetchFrom(loadedCount);
  }, [hasMore, fetchFrom, loadedCount]);

  return {
    /** `null` hasta que llega la primera pagina. */
    members: useProfileFallback(loaded),
    total,
    isSearching: debouncedSearch.trim() !== "",
    hasMore,
    isLoadingMore,
    errorMessage,
    loadMore,
    reload,
    refresh,
  };
}
