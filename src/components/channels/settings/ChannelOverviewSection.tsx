"use client";

import {
  type Channel,
  CHANNEL_NAME_LABEL,
  CHANNEL_SETTINGS_OVERVIEW_SECTION,
  CHANNEL_TOPIC_HINT,
  CHANNEL_TOPIC_LABEL,
  CHANNEL_TOPIC_PLACEHOLDER,
  MAX_NAME,
  validateChannelName,
} from "@discordia/client-shared";

import { Hash, Volume2 } from "lucide-react";
import { useCallback, useId, useState } from "react";

import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/cn";
import { updateChannelRequest } from "@/services/channels/client";

interface ChannelOverviewSectionProps {
  kind: Channel["kind"];
  form: ChannelOverviewForm;
}

export function ChannelOverviewSection({
  kind,
  form,
}: ChannelOverviewSectionProps) {
  const nameId = useId();
  const topicId = useId();
  const Icon = kind === "text" ? Hash : Volume2;

  return (
    <section>
      <h2 className="font-display text-content mb-7 text-xl font-bold">
        {CHANNEL_SETTINGS_OVERVIEW_SECTION}
      </h2>

      <div className="space-y-7">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor={nameId}
              className={cn(
                "text-xs font-bold tracking-wide uppercase",
                form.nameError ? "text-danger" : "text-content-muted",
              )}
            >
              {CHANNEL_NAME_LABEL}
            </label>
            <CharacterCounter length={form.name.trim().length} max={MAX_NAME} />
          </div>
          <div
            className={cn(
              "bg-surface-input flex items-center gap-2 rounded-md border px-3 py-2.5",
              form.nameError ? "border-danger" : "border-line",
            )}
          >
            <Icon size={15} className="text-content-subtle shrink-0" />
            <input
              id={nameId}
              type="text"
              value={form.name}
              onChange={(event) => form.setName(event.target.value)}
              maxLength={MAX_NAME + 10}
              aria-invalid={form.nameError ? true : undefined}
              className="text-content min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <FieldError message={form.nameError} />
        </div>

        {kind === "text" ? (
          <div>
            <label
              htmlFor={topicId}
              className="text-content-muted mb-2 block text-xs font-bold tracking-wide uppercase"
            >
              {CHANNEL_TOPIC_LABEL}
            </label>
            <textarea
              id={topicId}
              value={form.topic}
              onChange={(event) => form.setTopic(event.target.value)}
              rows={4}
              placeholder={CHANNEL_TOPIC_PLACEHOLDER}
              className="bg-surface-input border-line text-content placeholder:text-content-subtle w-full resize-none rounded-md border px-3 py-2.5 text-sm outline-none"
            />
            <p className="text-content-subtle mt-1.5 text-xs">
              {CHANNEL_TOPIC_HINT}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

type OverviewSaveResult =
  { ok: true; channel: Channel } | { ok: false; message?: string };

interface OverviewValues {
  name: string;
  topic: string;
}

function valuesOf(channel: Channel): OverviewValues {
  return { name: channel.name, topic: channel.topic ?? "" };
}

/**
 * Nombre y tema del canal en "Vista general". Al guardar manda solo lo que
 * cambio: el back pide MANAGE_CHANNELS para cualquiera de los dos.
 */
export function useChannelOverviewForm(channel: Channel) {
  const [saved, setSaved] = useState<OverviewValues>(() => valuesOf(channel));
  const [name, setNameValue] = useState(saved.name);
  const [topic, setTopic] = useState(saved.topic);
  const [nameError, setNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = name.trim() !== saved.name || topic !== saved.topic;

  const setName = useCallback((value: string) => {
    setNameValue(value);
    setNameError("");
  }, []);

  const reset = useCallback(() => {
    setNameValue(saved.name);
    setTopic(saved.topic);
    setNameError("");
  }, [saved]);

  /** Valida sin pegarle al back; devuelve `false` y marca el campo si falla. */
  const validate = useCallback((): boolean => {
    const error = validateChannelName(name);
    setNameError(error ?? "");
    return !error;
  }, [name]);

  const save = useCallback(async (): Promise<OverviewSaveResult> => {
    const trimmed = name.trim();
    const input: { name?: string; topic?: string } = {};
    if (trimmed !== saved.name) input.name = trimmed;
    if (topic !== saved.topic) input.topic = topic;

    setIsSaving(true);
    const result = await updateChannelRequest(channel.id, input);
    setIsSaving(false);
    if (!result.ok) {
      if (result.fieldErrors?.name) {
        setNameError(result.fieldErrors.name);
        return { ok: false };
      }
      return { ok: false, message: result.message };
    }

    const next = valuesOf(result.channel);
    setSaved(next);
    setNameValue(next.name);
    setTopic(next.topic);
    return { ok: true, channel: result.channel };
  }, [channel.id, name, saved, topic]);

  return {
    name,
    topic,
    nameError,
    hasChanges,
    isSaving,
    setName,
    setTopic,
    reset,
    validate,
    save,
  };
}

export type ChannelOverviewForm = ReturnType<typeof useChannelOverviewForm>;
