import { X } from "lucide-react";

import { cn } from "@/lib/cn";

interface ModalCloseButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

/** La "x" para cerrar un modal o panel. */
export function ModalCloseButton({
  onClick,
  label = "Cerrar",
  className,
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "bg-surface-input text-content-subtle border-line hover:text-content flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors",
        className,
      )}
    >
      <X size={14} />
    </button>
  );
}
