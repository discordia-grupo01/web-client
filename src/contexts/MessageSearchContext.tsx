"use client";

import {
  type Message,
  type MessageSearchQuery,
  validateMessageSearch,
} from "@discordia/client-shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useMobilePanels } from "@/contexts/MobilePanelsContext";

import { type MessageSearch, useMessageSearch } from "@/hooks/useMessageSearch";

interface MessageSearchValue {
  serverId: string;
  serverName: string;
  /** El panel de resultados esta abierto (en mobile, ademas, el drawer). */
  isOpen: boolean;
  /** Abre el panel (o, si ya estaba abierto, vuelve a poner el foco en el campo). */
  open: () => void;
  close: () => void;
  /** Borra texto, autor y resultados, y cierra el panel. */
  clear: () => void;
  /** Cambia en cada `open`: el campo del panel toma el foco. */
  focusToken: number;
  /** Lo que se esta escribiendo; se busca recien con `submit`. */
  draft: string;
  setDraft: (text: string) => void;
  authorId: string | null;
  /** Cambiar el autor busca al instante si hay algo que buscar. */
  setAuthorId: (authorId: string | null) => void;
  submit: () => void;
  /** Por que no se pudo buscar (texto vacio o muy largo). */
  validationError: string | null;
  search: MessageSearch;
  /** Click en un resultado: lo muestra en su canal. */
  openResult: (message: Message) => void;
}

const MessageSearchContext = createContext<MessageSearchValue | null>(null);

interface MessageSearchProviderProps {
  serverId: string;
  serverName: string;
  /** Lo maneja quien arma el layout: con el panel abierto se ocultan los miembros. */
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onOpenResult: (message: Message) => void;
  children: ReactNode;
}

/** Estado de la busqueda de mensajes de un servidor (caja del header + panel). */
export function MessageSearchProvider({
  serverId,
  serverName,
  isOpen,
  onOpenChange,
  onOpenResult,
  children,
}: MessageSearchProviderProps) {
  const search = useMessageSearch(serverId);
  const { openSearch, close: closeMobilePanel } = useMobilePanels();
  const [draft, setDraft] = useState("");
  const [authorId, setAuthor] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);

  const open = useCallback(() => {
    onOpenChange(true);
    openSearch();
    setFocusToken((token) => token + 1);
  }, [onOpenChange, openSearch]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const close = useCallback(() => {
    onOpenChange(false);
    closeMobilePanel();
  }, [onOpenChange, closeMobilePanel]);

  const run = useCallback(
    (query: MessageSearchQuery) => {
      const error = validateMessageSearch(query);
      setValidationError(error ?? null);
      open();
      if (!error) search.search(query);
    },
    [open, search],
  );

  const submit = useCallback(
    () => run({ text: draft, authorId }),
    [run, draft, authorId],
  );

  const setAuthorId = useCallback(
    (next: string | null) => {
      setAuthor(next);
      if (draft.trim() || next) {
        run({ text: draft, authorId: next });
      } else {
        setValidationError(null);
        search.reset();
      }
    },
    [draft, run, search],
  );

  const clear = useCallback(() => {
    setDraft("");
    setAuthor(null);
    setValidationError(null);
    search.reset();
    close();
  }, [search, close]);

  const openResult = useCallback(
    (message: Message) => {
      closeMobilePanel();
      onOpenResult(message);
    },
    [closeMobilePanel, onOpenResult],
  );

  const value = useMemo<MessageSearchValue>(
    () => ({
      serverId,
      serverName,
      isOpen,
      open,
      close,
      clear,
      focusToken,
      draft,
      setDraft: (text: string) => {
        setDraft(text);
        setValidationError(null);
      },
      authorId,
      setAuthorId,
      submit,
      validationError,
      search,
      openResult,
    }),
    [
      serverId,
      serverName,
      isOpen,
      open,
      close,
      clear,
      focusToken,
      draft,
      authorId,
      setAuthorId,
      submit,
      validationError,
      search,
      openResult,
    ],
  );

  return (
    <MessageSearchContext.Provider value={value}>
      {children}
    </MessageSearchContext.Provider>
  );
}

export function useMessageSearchContext(): MessageSearchValue {
  const context = useContext(MessageSearchContext);
  if (!context) {
    throw new Error(
      "useMessageSearchContext debe usarse dentro de <MessageSearchProvider>",
    );
  }
  return context;
}
