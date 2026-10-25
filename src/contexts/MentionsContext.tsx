"use client";

import type { MentionResolver, MentionSources } from "@discordia/client-shared";

import { createContext, useContext } from "react";

/**
 * Lo que necesita un chat de servidor para trabajar con menciones: quien es
 * cada id (para dibujarlas), a quien se puede mencionar (para el selector) y
 * quien soy yo (para resaltar los mensajes que me nombran). Un chat sin esto
 * (los mensajes directos) no tiene selector ni resaltados.
 */
export interface MessageMentionsValue {
  resolveMention?: MentionResolver;
  sources: MentionSources | null;
  me: { userId: string | null; roleIds: readonly string[] };
}

const NO_MENTIONS: MessageMentionsValue = {
  sources: null,
  me: { userId: null, roleIds: [] },
};

const MessageMentionsContext = createContext<MessageMentionsValue>(NO_MENTIONS);

export const MessageMentionsProvider = MessageMentionsContext.Provider;

export function useMessageMentions(): MessageMentionsValue {
  return useContext(MessageMentionsContext);
}
