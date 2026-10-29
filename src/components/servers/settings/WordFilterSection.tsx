"use client";

import {
  addBannedWord,
  BANNED_WORD_MAX_LENGTH,
  BANNED_WORDS_MAX,
  removeBannedWord,
  removeBannedWordLabel,
  validateBannedWord,
  WORD_FILTER_ADD_ACTION,
  WORD_FILTER_DESCRIPTION,
  WORD_FILTER_EMPTY,
  WORD_FILTER_INPUT_PLACEHOLDER,
  WORD_FILTER_SAVE_ACTION,
  WORD_FILTER_SAVED,
  WORD_FILTER_TITLE,
} from "@discordia/client-shared";
import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/cn";
import {
  listBannedWordsRequest,
  saveBannedWordsRequest,
} from "@/services/word-filter/client";

const INPUT_ID = "word-filter-input";

interface WordFilterSectionProps {
  serverId: string;
  titleId: string;
}

/**
 * Lista de palabras prohibidas (CA2). Los cambios quedan locales hasta
 * "Guardar cambios", que manda la lista entera: el back reemplaza la anterior
 * y se aplica a los mensajes que se envien desde ese momento.
 */
export function WordFilterSection({
  serverId,
  titleId,
}: WordFilterSectionProps) {
  const [saved, setSaved] = useState<string[] | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string>();
  const [loadError, setLoadError] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listBannedWordsRequest(serverId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }
      setSaved(result.words);
      setWords(result.words);
    });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  const isDirty =
    saved !== null &&
    (saved.length !== words.length || saved.some((w, i) => w !== words[i]));

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateBannedWord(draft, words);
    if (error) {
      setDraftError(error);
      return;
    }
    setWords((prev) => addBannedWord(prev, draft));
    setDraft("");
    setDraftError(undefined);
    setSavedNotice(false);
  }

  function handleRemove(word: string) {
    setWords((prev) => removeBannedWord(prev, word));
    setSavedNotice(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(undefined);
    const result = await saveBannedWordsRequest(serverId, words);
    setIsSaving(false);
    if (!result.ok) {
      setSaveError(result.message);
      return;
    }
    setSaved(result.words);
    setWords(result.words);
    setSavedNotice(true);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-4 pt-6 pb-2 sm:px-7 sm:pt-8">
        <h2
          id={titleId}
          className="font-display text-content mb-1 text-xl font-bold"
        >
          {WORD_FILTER_TITLE}
        </h2>
        <p className="text-content-muted text-sm leading-relaxed">
          {WORD_FILTER_DESCRIPTION}
        </p>
      </div>

      <div className="flex-1 space-y-5 px-4 py-6 sm:px-7">
        <FormAlert message={loadError ?? saveError} />

        {saved === null && !loadError ? (
          <p className="text-content-subtle text-sm">Cargando…</p>
        ) : null}

        {saved !== null ? (
          <>
            <form onSubmit={handleAdd}>
              <SectionLabel>
                <label htmlFor={INPUT_ID}>
                  {WORD_FILTER_INPUT_PLACEHOLDER}
                </label>
              </SectionLabel>
              <div className="mt-2 flex gap-2">
                <input
                  id={INPUT_ID}
                  type="text"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setDraftError(undefined);
                  }}
                  placeholder={WORD_FILTER_INPUT_PLACEHOLDER}
                  maxLength={BANNED_WORD_MAX_LENGTH + 10}
                  aria-invalid={draftError ? true : undefined}
                  className={cn(
                    "bg-surface-input text-content focus:border-accent min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm transition-colors outline-none",
                    draftError ? "border-danger" : "border-line",
                  )}
                />
                <Button type="submit" variant="secondary" className="w-auto">
                  {WORD_FILTER_ADD_ACTION}
                </Button>
              </div>
              <FieldError message={draftError} />
            </form>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <SectionLabel>{WORD_FILTER_TITLE}</SectionLabel>
                <span className="text-content-subtle text-xs tabular-nums">
                  {words.length}/{BANNED_WORDS_MAX}
                </span>
              </div>
              {words.length === 0 ? (
                <p className="text-content-subtle text-sm">
                  {WORD_FILTER_EMPTY}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {words.map((word) => (
                    <li
                      key={word}
                      className="border-line bg-surface-input text-content flex items-center gap-1.5 rounded-full border py-1 pr-1.5 pl-3 text-sm"
                    >
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(word)}
                        aria-label={removeBannedWordLabel(word)}
                        className="text-content-subtle hover:text-danger flex size-5 cursor-pointer items-center justify-center rounded-full transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </div>

      <div className="border-line flex items-center justify-end gap-3 border-t px-4 py-5 sm:px-7">
        {savedNotice && !isDirty ? (
          <span role="status" className="text-content-muted mr-auto text-sm">
            {WORD_FILTER_SAVED}
          </span>
        ) : null}
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={!isDirty}
          isLoading={isSaving}
          className="w-auto"
        >
          {WORD_FILTER_SAVE_ACTION}
        </Button>
      </div>
    </div>
  );
}
