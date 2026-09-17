import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

import { ACTIVITY_STATUS_LABEL, type ActivityStatus } from "./activity-status";

export type ActivityStatusMode = "auto" | "dnd" | "invisible";

const OPTIONS: {
  mode: ActivityStatusMode;
  label: string;
  activeClass: string;
  dotClass: string;
}[] = [
  {
    mode: "auto",
    label: "Automático",
    activeClass: "border-success/40 bg-success/10 text-success",
    dotClass: "bg-success",
  },
  {
    mode: "dnd",
    label: "No molestar",
    activeClass: "border-danger/40 bg-danger/10 text-danger",
    dotClass: "bg-danger",
  },
  {
    mode: "invisible",
    label: "Invisible",
    activeClass: "border-line-strong bg-surface-hover text-content-muted",
    dotClass: "bg-content-subtle",
  },
];

const PREVIEW_COPY: Record<
  ActivityStatusMode,
  (resolved: ActivityStatus) => string
> = {
  auto: (resolved) => `Visible como "${ACTIVITY_STATUS_LABEL[resolved]}"`,
  dnd: () => "Nadie puede enviarte mensajes directos.",
  invisible: () => "Aparecés como desconectado para el resto.",
};

interface ActivityStatusPickerProps {
  mode: ActivityStatusMode;
  /** Estado que se ve efectivamente cuando `mode` es "auto" (mock: siempre "online", no hay presencia real). */
  resolvedStatus: ActivityStatus;
  onChange: (mode: ActivityStatusMode) => void;
}

/**
 * Selector de estado de actividad del perfil propio. No hay sistema de
 * presencia en identify-service: esto es un mock puramente visual, sin
 * persistencia ni propagación a otros usuarios.
 */
export function ActivityStatusPicker({
  mode,
  resolvedStatus,
  onChange,
}: ActivityStatusPickerProps) {
  return (
    <div>
      <SectionLabel>Estado de actividad</SectionLabel>
      <div className="mt-1.5 flex gap-1.5">
        {OPTIONS.map((option) => {
          const active = mode === option.mode;
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => onChange(option.mode)}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors",
                active
                  ? option.activeClass
                  : "border-line bg-surface-input text-content-subtle",
              )}
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  active ? option.dotClass : "bg-content-subtle",
                )}
              />
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-content-subtle mt-2 pl-0.5 text-xs">
        {PREVIEW_COPY[mode](resolvedStatus)}
      </p>
    </div>
  );
}
