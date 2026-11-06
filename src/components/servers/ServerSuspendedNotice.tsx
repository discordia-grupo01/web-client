import {
  SERVER_SUSPENDED_HINT,
  SERVER_SUSPENDED_TITLE,
} from "@discordia/client-shared";
import { Ban } from "lucide-react";

export function ServerSuspendedNotice() {
  return (
    <div
      role="status"
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <div className="bg-surface-input flex size-14 items-center justify-center rounded-2xl">
        <Ban size={26} className="text-content" aria-hidden="true" />
      </div>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-content text-sm font-medium">
          {SERVER_SUSPENDED_TITLE}
        </p>
        <p className="text-content-muted text-xs">{SERVER_SUSPENDED_HINT}</p>
      </div>
    </div>
  );
}
