"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const GAP = 6;
const VIEWPORT_MARGIN = 8;

export interface FloatingPanelPosition {
  top: number;
  left?: number;
  right?: number;
  width?: number;
}

interface UseFloatingPanelOptions {
  /** Si es `false`, el hook no hace nada (el caller se posiciona solo, inline). */
  enabled: boolean;
  isOpen: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement>;
  /** "left" (default) alinea el borde izquierdo del panel con el anchor; "right" alinea el derecho; "stretch" iguala el ancho del panel al del anchor. */
  align?: "left" | "right" | "stretch";
}

/**
 * Lógica (sin markup) para un panel que necesita escapar del `overflow`
 * recortado de un ancestro (ej. un modal con scroll): calcula la posición en
 * coordenadas de viewport a partir del `anchorRef`, la recalcula en scroll/
 * resize, la voltea hacia arriba si no entra abajo, y cierra con click
 * afuera o Escape. El componente que usa este hook es responsable de
 * portar (`createPortal`) su panel a `document.body` con
 * `position: fixed` y el `top/left/right/width` que devuelve acá.
 *
 * Solo hace falta para el caso puntual que de verdad lo necesita (hoy: el
 * selector de "Añadir rol" en el perfil, dentro del modal con scroll) --
 * el resto de los menus/selects se posicionan inline porque nunca mostraron
 * el problema de recorte.
 */
export function useFloatingPanel({
  enabled,
  isOpen,
  onClose,
  anchorRef,
  align = "left",
}: UseFloatingPanelOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<FloatingPanelPosition | null>(null);

  useLayoutEffect(() => {
    if (!enabled || !isOpen) {
      setPosition(null);
      return;
    }

    function computePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();

      const next: FloatingPanelPosition = { top: rect.bottom + GAP };
      if (align === "right") {
        next.right = window.innerWidth - rect.right;
      } else {
        next.left = rect.left;
        if (align === "stretch") next.width = rect.width;
      }

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
  }, [enabled, isOpen, anchorRef, align]);

  useEffect(() => {
    if (!enabled || !isOpen) return;

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
  }, [enabled, isOpen, onClose, anchorRef]);

  return { panelRef, position };
}
