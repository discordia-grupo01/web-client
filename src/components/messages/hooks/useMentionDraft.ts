"use client";

import {
  applyMentionCandidate,
  createMentionDraft,
  type DraftSegment,
  draftSegments,
  type MentionCandidate,
  mentionDraftReducer,
  mentionDraftView,
  type MentionSources,
  type PickedMention,
} from "@discordia/client-shared";

import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import type { MessageEditorHandle } from "@/components/messages/MessageEditor";

interface UseMentionDraftOptions {
  editorRef: RefObject<MessageEditorHandle | null>;
  sources: MentionSources | null;
  initialText?: string;
  initialPicked?: PickedMention[];
}

export function useMentionDraft({
  editorRef,
  sources,
  initialText = "",
  initialPicked = [],
}: UseMentionDraftOptions) {
  const [state, dispatch] = useReducer(mentionDraftReducer, undefined, () =>
    createMentionDraft(initialText, initialPicked),
  );
  const [forcedCursor, setForcedCursor] = useState<number | null>(null);
  const view = useMemo(
    () => mentionDraftView(state, sources),
    [state, sources],
  );

  // Despues de elegir, el cursor tiene que quedar al final de lo insertado.
  useLayoutEffect(() => {
    if (forcedCursor === null) return;
    editorRef.current?.setCursor(forcedCursor);
    setForcedCursor(null);
  }, [forcedCursor, editorRef]);

  const handleChange = useCallback(
    (text: string, cursor: number) =>
      dispatch({ type: "change", text, cursor }),
    [],
  );

  /** El cursor se movio sin cambiar el texto (clic o flechas). */
  const handleCursorMove = useCallback(
    (cursor: number) => dispatch({ type: "moveCursor", cursor }),
    [],
  );

  const pick = useCallback(
    (candidate: MentionCandidate) => {
      if (!view.active) return;
      const applied = applyMentionCandidate(state.text, view.active, candidate);
      dispatch({ type: "pick", applied });
      setForcedCursor(applied.cursor);
    },
    [view.active, state.text],
  );

  /**
   * Teclas del selector abierto: flechas para moverse, Enter o Tab para elegir y
   * Esc para cerrarlo. Devuelve `true` si la tecla era suya (hay que cortar ahi).
   */
  const handleSuggestionKey = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!view.isOpen) return false;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        dispatch({
          type: "moveSelection",
          delta: event.key === "ArrowDown" ? 1 : -1,
          count: view.candidates.length,
        });
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const candidate = view.candidates[state.selectedIndex];
        if (candidate) pick(candidate);
        return true;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        dispatch({ type: "dismiss" });
        return true;
      }
      return false;
    },
    [view.isOpen, view.candidates, state.selectedIndex, pick],
  );

  const segments = useMemo<DraftSegment[] | null>(
    () =>
      sources
        ? draftSegments(state.text, state.picked, sources.canMentionEveryone)
        : null,
    [state.text, state.picked, sources],
  );

  return {
    text: state.text,
    segments,
    encoded: view.encoded,
    isOpen: view.isOpen,
    query: view.active?.query ?? "",
    candidates: view.candidates,
    selectedIndex: state.selectedIndex,
    handleChange,
    handleCursorMove,
    handleSuggestionKey,
    pick,
    append: (text: string) => dispatch({ type: "append", text }),
    reset: () => dispatch({ type: "reset" }),
  };
}
