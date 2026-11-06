"use client";

import {
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  clampOffset,
  dragBoundsOf,
  exceedsDragThreshold,
  type Offset,
} from "../bannerDrag";

const VIEWPORT_MARGIN = 8;
const DRAG_THRESHOLD = 6;

interface DragGesture {
  pointerId: number;
  pointerStart: Offset;
  offsetStart: Offset;
  isDragging: boolean;
}

export function useDraggableBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const offsetRef = useRef(offset);
  const gestureRef = useRef<DragGesture | null>(null);
  const justDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const moveTo = useCallback((next: Offset) => {
    const element = ref.current;
    const clamped = element
      ? clampWithinViewport(element, next, offsetRef.current)
      : next;
    offsetRef.current = clamped;
    setOffset(clamped);
  }, []);

  useEffect(() => {
    const keepInside = () => moveTo(offsetRef.current);
    window.addEventListener("resize", keepInside);
    return () => window.removeEventListener("resize", keepInside);
  }, [moveTo]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    justDraggedRef.current = false;
    gestureRef.current = {
      pointerId: event.pointerId,
      pointerStart: { x: event.clientX, y: event.clientY },
      offsetStart: offsetRef.current,
      isDragging: false,
    };
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const delta = {
        x: event.clientX - gesture.pointerStart.x,
        y: event.clientY - gesture.pointerStart.y,
      };
      if (!gesture.isDragging) {
        if (!exceedsDragThreshold(delta, DRAG_THRESHOLD)) return;
        gesture.isDragging = true;
        setIsDragging(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }
      moveTo({
        x: gesture.offsetStart.x + delta.x,
        y: gesture.offsetStart.y + delta.y,
      });
    },
    [moveTo],
  );

  const endGesture = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (!gesture.isDragging) return;
    justDraggedRef.current = true;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  // Soltar despues de arrastrar no tiene que contar como click en los botones.
  const onClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!justDraggedRef.current) return;
    justDraggedRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    ref,
    isDragging,
    style: { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` },
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
      onClickCapture,
    },
  };
}

function clampWithinViewport(
  element: HTMLElement,
  next: Offset,
  applied: Offset,
): Offset {
  const rect = element.getBoundingClientRect();
  const bounds = dragBoundsOf({
    banner: {
      x: rect.left - applied.x,
      y: rect.top - applied.y,
      width: rect.width,
      height: rect.height,
    },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    margin: VIEWPORT_MARGIN,
  });
  return clampOffset(next, bounds);
}
