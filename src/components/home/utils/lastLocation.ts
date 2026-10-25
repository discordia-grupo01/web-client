/** Donde estaba parado el usuario, para volver ahi al recargar la pagina. */
export interface LastLocation {
  view: "servers" | "direct-messages";
  serverId: string | null;
  channelId: string | null;
  partnerId: string | null;
}

const keyFor = (userId: string) => `discordia:last-location:${userId}`;

const orNull = (value: unknown): string | null =>
  typeof value === "string" && value !== "" ? value : null;

export function readLastLocation(userId: string): LastLocation | null {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const stored = data as Record<string, unknown>;
    return {
      view: stored.view === "servers" ? "servers" : "direct-messages",
      serverId: orNull(stored.serverId),
      channelId: orNull(stored.channelId),
      partnerId: orNull(stored.partnerId),
    };
  } catch {
    return null;
  }
}

export function writeLastLocation(
  userId: string,
  location: LastLocation,
): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(location));
  } catch {
    // Sin storage (modo privado, bloqueado): simplemente no se recuerda.
  }
}
