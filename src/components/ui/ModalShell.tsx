import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalShellProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
  /** Id del `<h2>` del modal, para `aria-labelledby`. */
  labelledBy?: string;
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
}: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth,
          maxHeight: "95dvh",
          background: "var(--bg-modal)",
        }}
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
