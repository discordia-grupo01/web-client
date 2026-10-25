"use client";

import type { FocusedMessage } from "@discordia/client-shared";
import { useLayoutEffect, useRef, type UIEvent } from "react";

/** Distancia al fondo (px) hasta la que se sigue considerando que se esta leyendo lo ultimo. */
const NEAR_BOTTOM_PX = 80;

interface StickyScrollOptions {
  /** Se ve un tramo del pasado: lo que se agrega abajo no arrastra el scroll. */
  isViewingPast?: boolean;
  /** Mensaje al que se salto: se lleva al centro de la vista. */
  focusedMessage?: FocusedMessage | null;
}

/**
 * Scroll de una lista de mensajes (de mas viejo a mas nuevo). Segun lo que
 * cambio en la lista:
 * - llegaron mensajes viejos arriba (cargar anteriores): se mantiene lo que
 *   se estaba leyendo, sin saltar;
 * - primera carga o mensaje nuevo al final: baja, salvo que se este leyendo
 *   mas arriba (no se le quita el lugar a quien mira el historial) o que se
 *   este viendo el pasado (lo de abajo son paginas cargadas a pedido);
 * - salto a un mensaje: lo centra.
 *
 * Se le pasan `ref` y `onScroll` al contenedor con `overflow-y-auto`; cada
 * fila tiene que llevar `data-message-id`.
 */
export function useStickyScroll(
  messages: { id: string }[],
  { isViewingPast = false, focusedMessage = null }: StickyScrollOptions = {},
) {
  const ref = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);
  const previous = useRef<{
    firstId: string | undefined;
    lastId: string | undefined;
    scrollHeight: number;
    wasViewingPast: boolean;
  }>({
    firstId: undefined,
    lastId: undefined,
    scrollHeight: 0,
    wasViewingPast: false,
  });

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
      const follows = !isViewingPast && !before.wasViewingPast;
      if (follows && (before.lastId === undefined || isNearBottom.current)) {
        container.scrollTop = container.scrollHeight;
      }
    }
    previous.current = {
      firstId,
      lastId,
      scrollHeight: container.scrollHeight,
      wasViewingPast: isViewingPast,
    };
  }, [messages, isViewingPast]);

  const focusNonce = focusedMessage?.nonce;
  const focusId = focusedMessage?.id;
  useLayoutEffect(() => {
    if (!focusId) return;
    const row = ref.current?.querySelector<HTMLElement>(
      `[data-message-id="${CSS.escape(focusId)}"]`,
    );
    row?.scrollIntoView({ block: "center" });
  }, [focusId, focusNonce]);

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
    isNearBottom.current =
      scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_PX;
  }

  return { ref, onScroll };
}
