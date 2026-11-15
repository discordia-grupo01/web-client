const SERVER_BOOSTS_EVENT = "discordia:open-server-boosts";

let pendingServerId: string | null = null;

export function requestServerBoosts(serverId: string): void {
  pendingServerId = serverId;
  window.dispatchEvent(
    new CustomEvent<string>(SERVER_BOOSTS_EVENT, { detail: serverId }),
  );
}

export function takeRequestedServerBoosts(serverId: string): boolean {
  if (pendingServerId !== serverId) return false;
  pendingServerId = null;
  return true;
}

export function onServerBoostsRequested(
  listener: (serverId: string) => void,
): () => void {
  function handle(event: Event) {
    const serverId = (event as CustomEvent<unknown>).detail;
    if (typeof serverId === "string") listener(serverId);
  }
  window.addEventListener(SERVER_BOOSTS_EVENT, handle);
  return () => window.removeEventListener(SERVER_BOOSTS_EVENT, handle);
}
