"use client";

import {
  type Channel,
  CHANNEL_NAME_LABEL,
  CHANNEL_TOPIC_HINT,
  CHANNEL_TOPIC_LABEL,
  CHANNEL_TOPIC_PLACEHOLDER,
  MAX_CHANNEL_TOPIC,
  MAX_NAME,
  validateChannelName,
  validateChannelTopic,
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
    <section className="space-y-6">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor={nameId}
            className="text-content-subtle text-xs font-bold tracking-wider uppercase"
          >
            {CHANNEL_NAME_LABEL} <span className="text-danger">*</span>
          </label>
          <CharacterCounter length={form.name.trim().length} max={MAX_NAME} />
        </div>
        <div
          className={cn(
            "bg-surface-input flex items-center gap-2 rounded-xl border px-4 py-3 transition-colors",
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
            className="text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
          />
        </div>
        <FieldError message={form.nameError} />
      </div>

      {kind === "text" ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor={topicId}
              className="text-content-subtle text-xs font-bold tracking-wider uppercase"
            >
              {CHANNEL_TOPIC_LABEL}
            </label>
            <CharacterCounter
              length={form.topic.trim().length}
              max={MAX_CHANNEL_TOPIC}
            />
          </div>
          <textarea
            id={topicId}
            value={form.topic}
            onChange={(event) => form.setTopic(event.target.value)}
            rows={3}
            maxLength={MAX_CHANNEL_TOPIC + 10}
            placeholder={CHANNEL_TOPIC_PLACEHOLDER}
            aria-invalid={form.topicError ? true : undefined}
            className={cn(
              "bg-surface-input text-content placeholder:text-content-subtle w-full resize-none rounded-xl border px-4 py-3 text-sm transition-colors outline-none",
              form.topicError ? "border-danger" : "border-line",
            )}
          />
          <FieldError message={form.topicError} />
          <p className="text-content-subtle mt-1.5 text-[11px]">
            {CHANNEL_TOPIC_HINT}
          </p>
        </div>
      ) : null}
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
  const [topic, setTopicValue] = useState(saved.topic);
  const [nameError, setNameError] = useState("");
  const [topicError, setTopicError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = name.trim() !== saved.name || topic !== saved.topic;

  const setName = useCallback((value: string) => {
    setNameValue(value);
    setNameError("");
  }, []);

  const setTopic = useCallback((value: string) => {
    setTopicValue(value);
    setTopicError("");
  }, []);

  const reset = useCallback(() => {
    setNameValue(saved.name);
    setTopicValue(saved.topic);
    setNameError("");
    setTopicError("");
  }, [saved]);

  /** Valida sin pegarle al back; devuelve `false` y marca el campo si falla. */
  const validate = useCallback((): boolean => {
    const nextNameError = validateChannelName(name) ?? "";
    // Un tema largo que ya venia del back no bloquea guardar el nombre.
    const nextTopicError =
      topic !== saved.topic ? (validateChannelTopic(topic) ?? "") : "";
    setNameError(nextNameError);
    setTopicError(nextTopicError);
    return !nextNameError && !nextTopicError;
  }, [name, topic, saved.topic]);

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
    setTopicValue(next.topic);
    return { ok: true, channel: result.channel };
  }, [channel.id, name, saved, topic]);

  return {
    name,
    topic,
    nameError,
    topicError,
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
