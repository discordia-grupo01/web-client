import { cn } from "@/lib/cn";

interface CountBadgeProps {
  count: number;
  /** Texto para lectores de pantalla ("3 mensajes sin leer"). */
  label: string;
  className?: string;
}

/** Contador rojo de no leidos (mensajes directos, menciones). */
export function CountBadge({ count, label, className }: CountBadgeProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "bg-danger flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
