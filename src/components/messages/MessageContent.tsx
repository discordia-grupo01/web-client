import { hexToRgba, tokenizeMessageContent } from "@discordia/client-shared";

import { Fragment } from "react";

/** Color a usar para un `@usuario` o `@rol` mencionado, o `null` si no se reconoce. */
export type MentionResolver = (name: string) => { color: string } | null;

const GENERIC_MENTION_CLASS = "bg-highlight/15 text-highlight rounded px-0.5";
const EVERYONE_NAMES = new Set(["everyone", "here"]);

interface MessageContentProps {
  content: string;
  /** Resuelve el color de `@usuario`/`@rol` por nombre. Ausente en DMs (sin roles de server). */
  resolveMention?: MentionResolver;
}

export function MessageContent({
  content,
  resolveMention,
}: MessageContentProps) {
  return (
    <p className="text-content text-sm leading-relaxed break-words whitespace-pre-wrap">
      {tokenizeMessageContent(content).map((token, index) => {
        if (token.kind === "text") {
          return <Fragment key={index}>{token.value}</Fragment>;
        }
        if (token.kind === "channel") {
          return (
            <span key={index} className={GENERIC_MENTION_CLASS}>
              {token.value}
            </span>
          );
        }

        const name = token.value.slice(1);
        if (EVERYONE_NAMES.has(name)) {
          return (
            <span
              key={index}
              className={`${GENERIC_MENTION_CLASS} font-semibold`}
            >
              {token.value}
            </span>
          );
        }

        const resolved = resolveMention?.(name);
        if (!resolved) {
          return (
            <span key={index} className={GENERIC_MENTION_CLASS}>
              {token.value}
            </span>
          );
        }
        return (
          <span
            key={index}
            className="rounded px-0.5 font-medium"
            style={{
              background: hexToRgba(resolved.color, 0.16),
              color: resolved.color,
            }}
          >
            {token.value}
          </span>
        );
      })}
    </p>
  );
}
