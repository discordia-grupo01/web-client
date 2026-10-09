import {
  isActiveMention,
  MENTION_DELETED_ROLE_NAME,
  type MessageMentions,
  tokenizeMessageContent,
  UNKNOWN_USER_NAME,
} from "@discordia/client-shared";

import { Fragment, type ReactNode } from "react";

import { MentionChip } from "./MentionChip";
import { useMessageMentions } from "./MentionsContext";

interface MessageContentProps {
  content: string;
  /**
   * Menciones que el back reconocio en el mensaje. Lo que no figura ahi (por
   * ejemplo un `@everyone` de alguien sin permiso) se dibuja como texto comun.
   */
  mentions?: MessageMentions;
  /** Va pegado al final del texto, en el mismo renglon si entra (ej. "(editado)"). */
  suffix?: ReactNode;
}

export function MessageContent({
  content,
  mentions = {},
  suffix,
}: MessageContentProps) {
  const { resolveMention } = useMessageMentions();

  return (
    <p className="text-content text-sm leading-relaxed break-words whitespace-pre-wrap">
      {tokenizeMessageContent(content).map((token, index) => {
        if (token.kind === "text") {
          return <Fragment key={index}>{token.value}</Fragment>;
        }
        if (token.kind === "channel") {
          return <MentionChip key={index} text={token.value} />;
        }
        if (!isActiveMention(token, mentions)) {
          return <Fragment key={index}>{token.value}</Fragment>;
        }
        if (token.kind === "everyone") {
          return <MentionChip key={index} text={token.value} isStrong />;
        }

        const resolved = resolveMention?.(token.kind, token.id);
        const fallbackName =
          token.kind === "role" ? MENTION_DELETED_ROLE_NAME : UNKNOWN_USER_NAME;
        return (
          <MentionChip
            key={index}
            text={`@${resolved?.name ?? fallbackName}`}
            color={resolved?.color}
          />
        );
      })}
      {suffix}
    </p>
  );
}
