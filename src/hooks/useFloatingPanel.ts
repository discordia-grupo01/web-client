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
  /** "left" (default) alinea el borde izquierdo del panel con el anchor; "right" alinea el derecho; "stretch" iguala el ancho del panel al del anchor; "side" lo abre al costado derecho del anchor (a la izquierda si no entra), alineado arriba. */
  align?: "left" | "right" | "stretch" | "side";
}

function samePosition(
  a: FloatingPanelPosition | null,
  b: FloatingPanelPosition,
): boolean {
  return (
    a !== null &&
    a.top === b.top &&
    a.left === b.left &&
    a.right === b.right &&
    a.width === b.width
  );
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
 * La posición depende del alto del panel, así que un panel cuyo contenido
 * llega tarde (`next/dynamic`, un web component que arma su shadow DOM en
 * otro frame) se mediría en cero y quedaría mal ubicado: por eso se espera a
 * tener alto real antes de publicar una posición y se vuelve a calcular con
 * un `ResizeObserver` cada vez que el panel cambia de tamaño.
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

      const panel = panelRef.current;
      const panelWidth = panel?.offsetWidth ?? 0;
      const panelHeight = panel?.offsetHeight ?? 0;

      // El panel ya está montado pero todavía sin contenido: ubicarlo con alto
      // cero lo dejaría colgando fuera de la pantalla. El ResizeObserver avisa
      // apenas tenga alto y se recalcula con la medida buena.
      if (panel && panelHeight === 0) return;

      const publish = (next: FloatingPanelPosition) =>
        setPosition((prev) => (samePosition(prev, next) ? prev : next));

      if (align === "side") {
        const fitsRight =
          rect.right + GAP + panelWidth <= window.innerWidth - VIEWPORT_MARGIN;
        const fitsLeft = rect.left - GAP - panelWidth >= VIEWPORT_MARGIN;
        const maxTop = window.innerHeight - VIEWPORT_MARGIN - panelHeight;
        publish({
          top: Math.max(VIEWPORT_MARGIN, Math.min(rect.top, maxTop)),
          left:
            !fitsRight && fitsLeft
              ? rect.left - GAP - panelWidth
              : rect.right + GAP,
        });
        return;
      }

      const next: FloatingPanelPosition = { top: rect.bottom + GAP };
      if (align === "right") {
        next.right = window.innerWidth - rect.right;
      } else {
        next.left = rect.left;
        if (align === "stretch") next.width = rect.width;
      }

      if (
        panelHeight > 0 &&
        next.top + panelHeight > window.innerHeight - VIEWPORT_MARGIN &&
        rect.top - panelHeight - GAP >= VIEWPORT_MARGIN
      ) {
        next.top = rect.top - panelHeight - GAP;
      }

      if (panelHeight > 0) {
        const maxTop = window.innerHeight - VIEWPORT_MARGIN - panelHeight;
        next.top = Math.max(VIEWPORT_MARGIN, Math.min(next.top, maxTop));
      }

      if (panelWidth > 0 && align !== "stretch") {
        const maxOffset = window.innerWidth - VIEWPORT_MARGIN - panelWidth;
        if (next.right !== undefined) {
          next.right = Math.max(
            VIEWPORT_MARGIN,
            Math.min(next.right, maxOffset),
          );
        }
        if (next.left !== undefined) {
          next.left = Math.max(VIEWPORT_MARGIN, Math.min(next.left, maxOffset));
        }
      }

      publish(next);
    }

    computePosition();
    window.addEventListener("scroll", computePosition, true);
    window.addEventListener("resize", computePosition);

    const panel = panelRef.current;
    let observer: ResizeObserver | undefined;
    if (panel && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => computePosition());
      observer.observe(panel);
    }

    return () => {
      observer?.disconnect();
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
