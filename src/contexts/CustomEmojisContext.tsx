"use client";

import {
  type CustomEmoji,
  MAX_CUSTOM_EMOJI_IDS,
} from "@discordia/client-shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { listCustomEmojisRequest } from "@/services/custom-emojis/client";

interface CustomEmojisValue {
  lookup: Readonly<Record<string, CustomEmoji | null>>;
  request: (ids: readonly string[]) => void;
}

const EMPTY: CustomEmojisValue = { lookup: {}, request: () => {} };

const CustomEmojisContext = createContext<CustomEmojisValue>(EMPTY);

const BATCH_MS = 30;

export function CustomEmojisProvider({ children }: { children: ReactNode }) {
  const [lookup, setLookup] = useState<Record<string, CustomEmoji | null>>({});
  const asked = useRef(new Set<string>());
  const queue = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    timer.current = null;
    const ids = [...queue.current].slice(0, MAX_CUSTOM_EMOJI_IDS);
    if (ids.length === 0) return;
    ids.forEach((id) => queue.current.delete(id));

    const result = await listCustomEmojisRequest(ids);
    if (!result.ok) {
      ids.forEach((id) => asked.current.delete(id));
      return;
    }

    const found = new Map(result.emojis.map((emoji) => [emoji.id, emoji]));
    setLookup((current) => {
      const next = { ...current };
      for (const id of ids) next[id] = found.get(id) ?? null;
      return next;
    });

    if (queue.current.size > 0) void flush();
  }, []);

  const request = useCallback(
    (ids: readonly string[]) => {
      let added = false;
      for (const id of ids) {
        if (asked.current.has(id)) continue;
        asked.current.add(id);
        queue.current.add(id);
        added = true;
      }
      if (!added || timer.current !== null) return;
      timer.current = setTimeout(() => void flush(), BATCH_MS);
    },
    [flush],
  );

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ lookup, request }), [lookup, request]);

  return (
    <CustomEmojisContext.Provider value={value}>
      {children}
    </CustomEmojisContext.Provider>
  );
}

/**
 * El emoji detrás de un id: `undefined` mientras se pide, `null` si no existe
 * (o si no hay id, que es lo que pasa con una reacción con emoji común).
 */
export function useCustomEmoji(
  id: string | null,
): CustomEmoji | null | undefined {
  const { lookup, request } = useContext(CustomEmojisContext);

  useEffect(() => {
    if (id !== null) request([id]);
  }, [id, request]);

  return id === null ? null : lookup[id];
}
