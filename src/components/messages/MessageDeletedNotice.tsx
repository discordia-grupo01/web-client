import { MESSAGE_DELETED_NOTICE } from "@discordia/client-shared";

import { CircleSlash } from "lucide-react";

/** Placeholder de un mensaje borrado: reemplaza el contenido, no la fila. */
export function MessageDeletedNotice() {
  return (
    <p className="text-content-subtle flex items-center gap-1.5 text-sm italic">
      <CircleSlash size={13} className="shrink-0" />
      {MESSAGE_DELETED_NOTICE}
    </p>
  );
}
