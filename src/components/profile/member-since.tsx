import { formatMemberSince } from "@discordia/client-shared";

import { Calendar } from "lucide-react";

import { SectionLabel } from "@/components/ui/section-label";

/** Bloque "Miembro desde" con la fecha de registro formateada. */
export function MemberSince({ isoDate }: { isoDate: string }) {
  return (
    <div>
      <SectionLabel>Miembro desde</SectionLabel>
      <div className="text-content-muted mt-1.5 flex items-center gap-2 text-sm">
        <Calendar size={14} className="text-content-subtle" />
        {formatMemberSince(isoDate)}
      </div>
    </div>
  );
}
