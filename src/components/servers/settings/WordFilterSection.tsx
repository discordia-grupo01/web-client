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
  WORD_FILTER_SAVED,
  WORD_FILTER_TITLE,
} from "@discordia/client-shared";
import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";
import { SaveBar } from "@/components/ui/settings/SaveBar";
import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/cn";
import {
  listBannedWordsRequest,
  saveBannedWordsRequest,
} from "@/services/word-filter/client";

const INPUT_ID = "word-filter-input";

interface WordFilterSectionProps {
  serverId: string;
}

/**
 * Lista de palabras prohibidas (CA2). Los cambios quedan locales hasta
 * "Guardar cambios", que manda la lista entera: el back reemplaza la anterior
 * y se aplica a los mensajes que se envien desde ese momento.
 */
export function WordFilterSection({ serverId }: WordFilterSectionProps) {
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

  function handleDiscard() {
    if (saved === null) return;
    setWords(saved);
    setDraftError(undefined);
    setSaveError(undefined);
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
    <SettingsSection
      description={WORD_FILTER_DESCRIPTION}
      footer={
        isDirty ? (
          <SaveBar
            isSaving={isSaving}
            onDiscard={handleDiscard}
            onSave={() => void handleSave()}
          />
        ) : null
      }
    >
      <div className="space-y-6">
        <FormAlert message={loadError ?? saveError} />

        {savedNotice && !isDirty ? (
          <p
            role="status"
            className="bg-success/10 text-success rounded-xl px-4 py-3 text-sm"
          >
            {WORD_FILTER_SAVED}
          </p>
        ) : null}

        {saved === null && !loadError ? <LoadingSpinner /> : null}

        {saved !== null ? (
          <>
            <form onSubmit={handleAdd}>
              <SettingsGroup
                label={
                  <label htmlFor={INPUT_ID}>
                    {WORD_FILTER_INPUT_PLACEHOLDER}
                  </label>
                }
              >
                <div className="flex gap-2">
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
              </SettingsGroup>
            </form>

            <SettingsGroup
              label={WORD_FILTER_TITLE}
              count={`${words.length}/${BANNED_WORDS_MAX}`}
            >
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
            </SettingsGroup>
          </>
        ) : null}
      </div>
    </SettingsSection>
  );
}
