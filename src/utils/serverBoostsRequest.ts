import type { BoostSectionTab } from "@discordia/client-shared";

const SERVER_BOOSTS_EVENT = "discordia:open-server-boosts";

interface ServerBoostsRequest {
  serverId: string;
  tab: BoostSectionTab;
}

let pending: ServerBoostsRequest | null = null;

export function requestServerBoosts(
  serverId: string,
  tab: BoostSectionTab = "boost",
): void {
  pending = { serverId, tab };
  window.dispatchEvent(
    new CustomEvent<ServerBoostsRequest>(SERVER_BOOSTS_EVENT, {
      detail: { serverId, tab },
    }),
  );
}

/** La pestaña pedida para ese servidor, o `null` si no había pedido. */
export function takeRequestedServerBoosts(
  serverId: string,
): BoostSectionTab | null {
  if (pending?.serverId !== serverId) return null;
  const { tab } = pending;
  pending = null;
  return tab;
}

function isRequest(value: unknown): value is ServerBoostsRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    "serverId" in value &&
    typeof value.serverId === "string" &&
    "tab" in value &&
    (value.tab === "boost" || value.tab === "benefits")
  );
}

export function onServerBoostsRequested(
  listener: (serverId: string, tab: BoostSectionTab) => void,
): () => void {
  function handle(event: Event) {
    const detail = (event as CustomEvent<unknown>).detail;
    if (isRequest(detail)) listener(detail.serverId, detail.tab);
  }
  window.addEventListener(SERVER_BOOSTS_EVENT, handle);
  return () => window.removeEventListener(SERVER_BOOSTS_EVENT, handle);
}
