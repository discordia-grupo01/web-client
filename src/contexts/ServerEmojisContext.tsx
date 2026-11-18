"use client";

import type { ServerEmoji } from "@discordia/client-shared";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { listServerEmojisRequest } from "@/services/emojis/client";

export interface EmojiCatalogServer {
  id: string;
  name: string;
  icon_url: string | null;
}

interface ServerEmojisValue {
  servers: EmojiCatalogServer[];
  /** Emojis por servidor. Un servidor sin entrada todavía no se cargó. */
  byServer: Readonly<Record<string, ServerEmoji[]>>;
  /** Carga perezosa: se llama al abrir el selector por primera vez. */
  load: () => void;
}

const EMPTY: ServerEmojisValue = { servers: [], byServer: {}, load: () => {} };

export const ServerEmojisContext = createContext<ServerEmojisValue>(EMPTY);

/**
 * Los emojis de todos los servidores donde está la persona, para el selector
 * del chat: se pueden usar en cualquier canal y también en un mensaje directo
 * (los de otro servidor y los de un DM piden Premium, pero se ven igual).
 *
 * Se cargan una sola vez, recién cuando se abre el selector, y se refrescan con
 * el aviso de socket `emojis` de cualquier servidor.
 */
export function ServerEmojisProvider({
  servers,
  children,
}: {
  servers: EmojiCatalogServer[];
  children: ReactNode;
}) {
  const [byServer, setByServer] = useState<Record<string, ServerEmoji[]>>({});
  const [isEnabled, setIsEnabled] = useState(false);
  const serverIds = servers.map((server) => server.id).join(",");
  const idsRef = useRef(serverIds);
  idsRef.current = serverIds;

  const loadAll = useCallback(async () => {
    const ids = idsRef.current === "" ? [] : idsRef.current.split(",");
    const pages = await Promise.all(
      ids.map(async (id) => [id, await listServerEmojisRequest(id)] as const),
    );
    setByServer((current) => {
      const next = { ...current };
      for (const [id, result] of pages) {
        if (result.ok) next[id] = result.page.emojis;
      }
      return next;
    });
  }, []);

  const load = useCallback(() => {
    setIsEnabled((wasEnabled) => {
      if (!wasEnabled) void loadAll();
      return true;
    });
  }, [loadAll]);

  useRefreshOnChange({ resources: ["emojis"] }, loadAll, {
    enabled: isEnabled,
  });

  const value = useMemo(
    () => ({ servers, byServer, load }),
    [servers, byServer, load],
  );

  return (
    <ServerEmojisContext.Provider value={value}>
      {children}
    </ServerEmojisContext.Provider>
  );
}

export function useServerEmojiCatalog(): ServerEmojisValue {
  return useContext(ServerEmojisContext);
}
