import type { ReactNode } from "react";

interface ProfileModalOverlayProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}

/**
 * Backdrop fijo + cierre al clickear afuera + card contenedora, compartido
 * por el modal de perfil propio y el de perfil público.
 */
export function ProfileModalOverlay({
  onClose,
  children,
  maxWidth = 400,
}: ProfileModalOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth,
          maxHeight: "95dvh",
          background: "var(--bg-modal)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
