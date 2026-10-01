"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Etiqueta para lectores de pantalla: el input no lleva label visible. */
  label: string;
  placeholder: string;
}

/** Campo de busqueda con lupa y boton para limpiar. */
export function SearchInput({
  value,
  onChange,
  label,
  placeholder,
}: SearchInputProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="bg-surface-input border-line focus-within:border-accent flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors">
        <Search
          size={15}
          className="text-content-subtle shrink-0"
          aria-hidden="true"
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="text-content placeholder:text-content-subtle min-w-0 flex-1 appearance-none border-none bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Limpiar búsqueda"
            className="text-content-subtle hover:text-content flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
