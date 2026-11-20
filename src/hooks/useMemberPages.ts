"use client";

import {
  type ListMembersResult,
  type Member,
  type MemberPageQuery,
} from "@discordia/client-shared";

import { useCallback } from "react";

import { usePagedList } from "./usePagedList";

export type MemberPageFetcher = (
  query: MemberPageQuery,
) => Promise<ListMembersResult>;

interface UseMemberPagesOptions {
  /** Tiene que ser estable (`useCallback`), ver `usePagedList`. */
  fetchPage: MemberPageFetcher;
  search: string;
  enabled?: boolean;
  pageSize?: number;
}

export function useMemberPages({
  fetchPage,
  ...options
}: UseMemberPagesOptions) {
  const fetchItems = useCallback(
    async (query: MemberPageQuery) => {
      const result = await fetchPage(query);
      return result.ok
        ? { ok: true as const, items: result.members, total: result.total }
        : result;
    },
    [fetchPage],
  );
  const { items, ...pages } = usePagedList<Member>({
    fetchPage: fetchItems,
    ...options,
  });
  return { ...pages, members: items };
}
