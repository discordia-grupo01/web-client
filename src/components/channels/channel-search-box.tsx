"use client";

import { Search } from "lucide-react";

const NOT_IMPLEMENTED = "La búsqueda todavía no está disponible";

export function ChannelSearchBox() {
  return (
    <div
      title={NOT_IMPLEMENTED}
      className="bg-surface-input border-line text-content-subtle flex h-8 w-44 cursor-not-allowed items-center gap-1.5 rounded-lg border px-2.5"
    >
      <Search size={14} className="shrink-0" />
      <input
        type="search"
        placeholder="Buscar"
        disabled
        aria-label={NOT_IMPLEMENTED}
        className="min-w-0 flex-1 cursor-not-allowed border-none bg-transparent text-xs outline-none"
      />
    </div>
  );
}
