import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface ModalShellProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
  /** Id del `<h2>` del modal, para `aria-labelledby`. */
  labelledBy?: string;
  /** Por debajo de `sm` ocupa toda la pantalla, sin bordes ni margen. */
  isFullScreenOnMobile?: boolean;
}

/**
 * Backdrop + card + boton de cierre: el chasis que comparten los modales de
 * la app. Estaba copiado literal en cada uno (`create-server-modal`,
 * `edit-channel-modal`, ...); los que todavia lo tienen inline pueden migrar
 * aca sin cambiar como se ven.
 */
export function ModalShell({
  onClose,
  children,
  maxWidth = 460,
  labelledBy,
  isFullScreenOnMobile = false,
}: ModalShellProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm sm:p-6",
        !isFullScreenOnMobile && "p-4",
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "border-line-strong relative flex w-full flex-col overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55)]",
          isFullScreenOnMobile
            ? "h-dvh sm:h-auto sm:max-h-[95dvh] sm:rounded-[20px] sm:border"
            : "max-h-[95dvh] rounded-[20px] border",
        )}
        style={{ maxWidth, background: "var(--bg-modal)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="bg-surface-input text-content-subtle border-line absolute top-4 right-4 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-110"
        >
          <X size={14} />
        </button>

        {children}
      </div>
    </div>
  );
}
