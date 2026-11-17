"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Qué oferta de Premium está mostrando el chat debajo del compositor.
 *
 * Por ahora una sola: se quiso sumar a una reacción con un emoji que pide
 * Premium. Vive acá y no en el mensaje porque el cartel va debajo del
 * compositor, que es hermano de la lista y no la contiene.
 */
export type ChatPremiumOffer = "custom_emoji_reaction";

interface ChatPremiumOfferValue {
  offer: ChatPremiumOffer | null;
  show: (offer: ChatPremiumOffer) => void;
  clear: () => void;
}

const NONE: ChatPremiumOfferValue = {
  offer: null,
  show: () => {},
  clear: () => {},
};

const ChatPremiumOfferContext = createContext<ChatPremiumOfferValue>(NONE);

export function ChatPremiumOfferProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [offer, setOffer] = useState<ChatPremiumOffer | null>(null);
  const show = useCallback((next: ChatPremiumOffer) => setOffer(next), []);
  const clear = useCallback(() => setOffer(null), []);
  const value = useMemo(
    () => ({ offer, show, clear }),
    [offer, show, clear],
  );

  return (
    <ChatPremiumOfferContext.Provider value={value}>
      {children}
    </ChatPremiumOfferContext.Provider>
  );
}

export function useChatPremiumOffer(): ChatPremiumOfferValue {
  return useContext(ChatPremiumOfferContext);
}
