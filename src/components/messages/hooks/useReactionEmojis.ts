"use client";

import {
  canUseCustomEmoji,
  customEmojiReactionTooltip,
  customEmojiToken,
  premiumReasonForCustomEmoji,
  type ServerEmoji,
} from "@discordia/client-shared";
import { useCallback, useMemo } from "react";

import { useOwnPremium } from "@/contexts/OwnProfileContext";
import { useServerEmojiCatalog } from "@/contexts/ServerEmojisContext";

import {
  useCustomEmojiPicker,
  type CustomEmojiCategory,
} from "./useCustomEmojiPicker";

/** Lo mínimo que hace falta de un emoji para saber si pide Premium. */
type EmojiUse = Pick<ServerEmoji, "animated" | "server_id">;

/** Qué hacer con el emoji del servidor que se eligió para reaccionar. */
export type CustomReactionPick =
  /** Se puede: el token que viaja al back. */
  | { kind: "react"; token: string }
  /** Pide Premium y no hay: se muestra la oferta en vez de mandar el pedido. */
  | { kind: "premium" }
  /** El selector devolvió un id que no está en el catálogo: no se hace nada. */
  | { kind: "unknown" };

/** Las props del selector de emojis cuando se usa para reaccionar. */
export interface ReactionPickerProps {
  custom?: CustomEmojiCategory[];
  lockedTooltips?: string[];
  lockedCategoryIds?: string[];
  showsPremiumNote?: boolean;
  onPickCustom?: (id: string) => void;
  onOpenPremium?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export interface ReactionEmojis {
  picker: ReactionPickerProps;
  /** El catálogo se pide recién al abrir el selector, una vez por sesión. */
  load: () => void;
  pick: (id: string) => CustomReactionPick;
  /** Un emoji ya usado en una reacción que esta persona no puede usar. */
  isLocked: (emoji: EmojiUse) => boolean;
  /** El globito del chip: qué emoji es y, si corresponde, por qué no se puede. */
  tooltip: (emoji: EmojiUse, name: string) => string;
}

/**
 * Los emojis del servidor para reaccionar, con la misma regla que el
 * compositor: los animados, los de otro servidor y todos los de un mensaje
 * directo (`serverId` en `null`) piden Premium.
 *
 * Se arma una sola vez por lista de mensajes y se reparte a cada mensaje: el
 * catálogo es el mismo para todos y armarlo por mensaje sería rehacer el mismo
 * trabajo tantas veces como mensajes haya en pantalla.
 */
export function useReactionEmojis(serverId: string | null): ReactionEmojis {
  const isPremium = useOwnPremium();
  const { load } = useServerEmojiCatalog();
  const catalog = useCustomEmojiPicker(serverId, isPremium);

  const isLocked = useCallback(
    (emoji: EmojiUse) => !canUseCustomEmoji({ emoji, serverId, isPremium }),
    [serverId, isPremium],
  );

  const tooltip = useCallback(
    (emoji: EmojiUse, name: string) =>
      customEmojiReactionTooltip(name, {
        // Lo de "animado" se aclara solo donde ser GIF es lo que lo bloquea.
        // En un mensaje directo, y en los de otro servidor, piden Premium
        // todos por igual y distinguirlos marcaría una diferencia que no hay.
        animated: premiumReasonForCustomEmoji(emoji, serverId) === "animated",
        locked: isLocked(emoji),
      }),
    [serverId, isLocked],
  );

  const pick = useCallback(
    (id: string): CustomReactionPick => {
      const emoji = catalog.byId[id];
      if (!emoji) return { kind: "unknown" };
      if (isLocked(emoji)) return { kind: "premium" };
      return { kind: "react", token: customEmojiToken(emoji) };
    },
    [catalog.byId, isLocked],
  );

  return useMemo(
    () => ({
      picker: {
        custom: catalog.categories,
        lockedTooltips: catalog.lockedTooltips,
        lockedCategoryIds: catalog.lockedCategoryIds,
        showsPremiumNote: catalog.hasLocked,
        onOpenChange: (isOpen: boolean) => {
          if (isOpen) load();
        },
      },
      load,
      pick,
      isLocked,
      tooltip,
    }),
    [catalog, load, pick, isLocked, tooltip],
  );
}
