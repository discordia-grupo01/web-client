"use client";

import {
  clampPage,
  DEFAULT_PAGE_SIZE,
  pageCountOf,
  pageRange,
  paginate,
} from "@discordia/client-shared";

import { useCallback, useMemo, useState } from "react";

/**
 * Estado de paginacion en memoria sobre una lista ya cargada. La logica pura
 * (rangos, ventana de paginas) vive en `@discordia/client-shared` para que
 * `app-mobile` use la misma; esto solo la ata al estado de React.
 *
 * `page` se devuelve ya acotado: si la lista se achica (filtro, baneo
 * revocado) la pagina guardada puede quedar fuera de rango y se corrige sola,
 * sin un efecto extra.
 */
export function usePagination<T>(
  items: readonly T[],
  initialPageSize: number = DEFAULT_PAGE_SIZE,
) {
  const [requestedPage, setRequestedPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const total = items.length;
  const pageCount = pageCountOf(total, pageSize);
  const page = clampPage(requestedPage, pageCount);

  const pageItems = useMemo(
    () => paginate(items, page, pageSize),
    [items, page, pageSize],
  );

  const setPage = useCallback(
    (next: number) => setRequestedPage(clampPage(next, pageCount)),
    [pageCount],
  );
  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setRequestedPage(1);
  }, []);
  const resetPage = useCallback(() => setRequestedPage(1), []);

  return {
    pageItems,
    page,
    pageCount,
    pageSize,
    total,
    range: pageRange(page, pageSize, total),
    setPage,
    setPageSize,
    resetPage,
  };
}
