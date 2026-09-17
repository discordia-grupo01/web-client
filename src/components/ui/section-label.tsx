import type { ReactNode } from "react";

/** Título chico en mayúsculas para una sección dentro de un modal. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-content-subtle text-[10px] font-bold tracking-wider uppercase">
      {children}
    </h3>
  );
}
