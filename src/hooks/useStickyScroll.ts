"use client";

import { useLayoutEffect, useRef, type UIEvent } from "react";

/** Distancia al fondo (px) hasta la que se sigue considerando que se esta leyendo lo ultimo. */
const NEAR_BOTTOM_PX = 80;

/**
 * Scroll de una lista de mensajes (de mas viejo a mas nuevo). Segun lo que
 * cambio en la lista:
 * - llegaron mensajes viejos arriba (cargar anteriores): se mantiene lo que
 *   se estaba leyendo, sin saltar;
 * - primera carga o mensaje nuevo al final: baja, salvo que se este leyendo
 *   mas arriba (no se le quita el lugar a quien mira el historial).
 *
 * Se le pasan `ref` y `onScroll` al contenedor con `overflow-y-auto`.
 */
export function useStickyScroll(messages: { id: string }[]) {
  const ref = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);
  const previous = useRef<{
    firstId: string | undefined;
    lastId: string | undefined;
    scrollHeight: number;
  }>({ firstId: undefined, lastId: undefined, scrollHeight: 0 });

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;
    const firstId = messages[0]?.id;
    const lastId = messages[messages.length - 1]?.id;
    const before = previous.current;

    if (
      before.firstId !== undefined &&
      firstId !== before.firstId &&
      lastId === before.lastId
    ) {
      container.scrollTop += container.scrollHeight - before.scrollHeight;
    } else if (lastId !== before.lastId) {
      if (before.lastId === undefined || isNearBottom.current) {
        container.scrollTop = container.scrollHeight;
      }
    }
    previous.current = {
      firstId,
      lastId,
      scrollHeight: container.scrollHeight,
    };
  }, [messages]);

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
    isNearBottom.current =
      scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_PX;
  }

  return { ref, onScroll };
}
