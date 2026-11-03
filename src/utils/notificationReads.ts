import type { NotificationReadMarks } from "@discordia/client-shared";

const keyFor = (userId: string) => `discordia:notification-reads:${userId}`;

export function readNotificationReadMarks(
  userId: string,
): NotificationReadMarks {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return {};
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(data).filter(
        ([, value]) =>
          typeof value === "string" && !Number.isNaN(Date.parse(value)),
      ),
    );
  } catch {
    return {};
  }
}

export function writeNotificationReadMarks(
  userId: string,
  marks: NotificationReadMarks,
): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(marks));
  } catch {
    return;
  }
}
