import { Star } from "lucide-react";

import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/cn";

interface DefaultRoleCardProps {
  isDefault: boolean;
  disabled: boolean;
  onSetDefault: () => void;
}

/** Con la misma estrella que marca al rol por defecto en la lista y el encabezado. */
export function DefaultRoleCard({
  isDefault,
  disabled,
  onSetDefault,
}: DefaultRoleCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-colors sm:px-5",
        isDefault
          ? "border-highlight/30 bg-highlight/[0.07]"
          : "border-line bg-surface-raised",
      )}
    >
      <span className="bg-highlight/15 text-highlight flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Star size={18} fill={isDefault ? "currentColor" : "none"} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-content text-sm font-medium">Rol por defecto</p>
        <p className="text-content-subtle mt-0.5 text-xs leading-relaxed">
          {isDefault
            ? "Se asigna automáticamente a los nuevos miembros. Para cambiarlo, definí otro rol como predeterminado."
            : "Se asigna automáticamente a los nuevos miembros."}
        </p>
      </div>
      <Switch
        checked={isDefault}
        label="Rol por defecto"
        disabled={isDefault || disabled}
        onChange={(on) => {
          if (on) onSetDefault();
        }}
      />
    </div>
  );
}
