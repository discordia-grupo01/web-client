"use client";

import {
  BOOSTED_SERVERS_PAGE_SIZE,
  type BoostedServersPage,
} from "@discordia/client-shared";

import { useOffsetPages } from "@/hooks/useOffsetPages";
import { listBoostedServersRequest } from "@/services/billing/client";

const countServers = (page: BoostedServersPage) => page.servers.length;

export function useBoostedServersPage() {
  return useOffsetPages({
    fetchPage: listBoostedServersRequest,
    countOf: countServers,
    pageSize: BOOSTED_SERVERS_PAGE_SIZE,
    refreshOn: { resources: ["boosts"] },
  });
}
