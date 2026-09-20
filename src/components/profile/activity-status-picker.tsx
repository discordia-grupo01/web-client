import {
  ACTIVITY_STATUS_DESCRIPTION,
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_STATUSES,
  type ActivityStatus,
} from "@discordia/client-shared";

import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

import { ACTIVITY_STATUS_DOT_CLASS } from "./activity-status";

/** Solo presentacion: el resto del modelo vive en `client-shared`. */
const ACTIVE_CLASS: Record<ActivityStatus, string> = {
  online: "border-success/40 bg-success/10 text-success",
  dnd: "border-danger/40 bg-danger/10 text-danger",
  offline: "border-line-strong bg-surface-hover text-content-muted",
};

interface ActivityStatusPickerProps {
  status: ActivityStatus;
  onChange: (status: ActivityStatus) => void;
}

/**
 * Selector de estado de actividad del perfil propio. No hay sistema de
 * presencia en identify-service: esto es un mock puramente visual, sin
 * persistencia ni propagación a otros usuarios.
 */
export function ActivityStatusPicker({
  status,
  onChange,
}: ActivityStatusPickerProps) {
  return (
    <div>
      <SectionLabel>Estado de actividad</SectionLabel>
      <div className="mt-1.5 flex gap-1.5">
        {ACTIVITY_STATUSES.map((option) => {
          const active = status === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors",
                active
                  ? ACTIVE_CLASS[option]
                  : "border-line bg-surface-input text-content-subtle",
              )}
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  active
                    ? ACTIVITY_STATUS_DOT_CLASS[option]
                    : "bg-content-subtle",
                )}
              />
              {ACTIVITY_STATUS_LABEL[option]}
            </button>
          );
        })}
      </div>
      <p className="text-content-subtle mt-2 pl-0.5 text-xs">
        {ACTIVITY_STATUS_DESCRIPTION[status]}
      </p>
    </div>
  );
}
