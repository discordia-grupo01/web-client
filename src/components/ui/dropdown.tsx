"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

interface DropdownProps {
  /** Elemento que dispara el dropdown (el botón/trigger). */
  anchorRef: RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /**
   * "left" (default) alinea el borde izquierdo del panel con el trigger;
   * "right" alinea el borde derecho; "stretch" iguala el ancho del panel al
   * del trigger (para reemplazar un `<select>` nativo).
   */
  align?: "left" | "right" | "stretch";
  className?: string;
}

const GAP = 6;
const VIEWPORT_MARGIN = 8;

interface Position {
  top: number;
  left?: number;
  right?: number;
  width?: number;
}

/**
 * Panel flotante posicionado por coordenadas y portado a `document.body`, en
 * vez de vivir `absolute` dentro del flujo normal: así ningún ancestro con
 * `overflow-y-auto` lo recorta (el bug que tenían el selector de roles y los
 * menus de canal/categoría/header, todos dentro de contenedores con
 * scroll). Cierra con click afuera (listener de `mousedown`) y con Escape --
 * sin el viejo truco de un botón `fixed inset-0` invisible, que interceptaba
 * el scroll wheel de toda la pantalla mientras el panel estaba abierto.
 */
export function Dropdown({
  anchorRef,
  isOpen,
  onClose,
  children,
  align = "left",
  className,
}: DropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    function computePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();

      const next: Position = { top: rect.bottom + GAP };
      if (align === "right") {
        next.right = window.innerWidth - rect.right;
      } else {
        next.left = rect.left;
        if (align === "stretch") next.width = rect.width;
      }

      // El panel ya está montado (aunque invisible/fuera de pantalla en el
      // primer pase), asi que su altura real ya se puede medir para decidir
      // si hay que voltearlo hacia arriba cuando no entra abajo.
      const panelHeight = panelRef.current?.offsetHeight ?? 0;
      if (
        panelHeight > 0 &&
        next.top + panelHeight > window.innerHeight - VIEWPORT_MARGIN &&
        rect.top - panelHeight - GAP >= VIEWPORT_MARGIN
      ) {
        next.top = rect.top - panelHeight - GAP;
      }

      setPosition(next);
    }

    computePosition();
    window.addEventListener("scroll", computePosition, true);
    window.addEventListener("resize", computePosition);
    return () => {
      window.removeEventListener("scroll", computePosition, true);
      window.removeEventListener("resize", computePosition);
    };
  }, [isOpen, anchorRef, align]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className={cn(
        "bg-surface-raised border-line-strong fixed z-50 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border shadow-2xl",
        !position && "invisible",
        className,
      )}
      style={{
        top: position?.top ?? -9999,
        left: position?.left,
        right: position?.right,
        width: position?.width,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
