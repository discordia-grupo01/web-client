"use client";

import {
  canUseCustomEmoji,
  customEmojiTooltip,
  premiumReasonForCustomEmoji,
  type ServerEmoji,
} from "@discordia/client-shared";
import { useMemo } from "react";

import { useServerEmojiCatalog } from "@/contexts/ServerEmojisContext";
import { emojiImageSrc, serverIconSrc } from "@/utils/image-urls";

import { serverCategoryIcon } from "../utils/serverCategoryIcon";

/** Una categoría de emoji-mart armada con los emojis de un servidor. */
export interface CustomEmojiCategory {
  id: string;
  name: string;
  /**
   * La imagen de su solapa. Va en la categoría y no en el `categoryIcons` de
   * emoji-mart porque es lo único que le da solapa propia (ver
   * `serverCategoryIcon`).
   */
  icon: { src: string };
  emojis: {
    id: string;
    name: string;
    keywords: string[];
    skins: { src: string }[];
  }[];
}

export interface CustomEmojiPicker {
  categories: CustomEmojiCategory[];
  /** Tooltips de los que piden Premium: el selector los marca con la insignia. */
  lockedTooltips: string[];
  /** Categorías donde no se puede usar nada: llevan el cartel de Premium. */
  lockedCategoryIds: string[];
  /** El emoji detrás de un id del selector, para escribirlo al elegirlo. */
  byId: Record<string, ServerEmoji>;
  /** Hay algo bloqueado: se ofrece Premium debajo del selector. */
  hasLocked: boolean;
}

/**
 * Los emojis de todos los servidores como categorías del selector, con el ícono
 * de cada servidor en la barra. Primero el del canal, que son los que cualquiera
 * puede usar ahí; en un mensaje directo (`serverId` en `null`) van en el orden
 * de la lista y todos piden Premium.
 */
export function useCustomEmojiPicker(
  serverId: string | null,
  isPremium: boolean,
): CustomEmojiPicker {
  const { servers, byServer } = useServerEmojiCatalog();

  return useMemo(() => {
    const ordered = [...servers].sort((a, b) =>
      a.id === serverId ? -1 : b.id === serverId ? 1 : 0,
    );

    const categories: CustomEmojiCategory[] = [];
    const lockedTooltips: string[] = [];
    const lockedCategoryIds: string[] = [];
    const byId: Record<string, ServerEmoji> = {};

    for (const server of ordered) {
      const emojis = byServer[server.id] ?? [];
      if (emojis.length === 0) continue;

      const categoryId = `server-${server.id}`;
      let lockedInCategory = 0;

      categories.push({
        id: categoryId,
        name: server.name,
        icon: serverCategoryIcon({
          name: server.name,
          iconSrc: serverIconSrc({ ...server, banner_url: null }),
        }),
        emojis: emojis.map((emoji) => {
          const locked = !canUseCustomEmoji({ emoji, serverId, isPremium });
          const tooltip = customEmojiTooltip(emoji.name, {
            // Lo de "animado" se aclara solo donde ser GIF es lo que lo
            // bloquea. En un mensaje directo, y en los emojis de otro
            // servidor, piden Premium todos por igual: ahí distinguir el GIF
            // del quieto sería marcar una diferencia que no existe.
            animated:
              premiumReasonForCustomEmoji(emoji, serverId) === "animated",
            locked,
          });
          if (locked) {
            lockedInCategory += 1;
            lockedTooltips.push(tooltip);
          }
          byId[emoji.id] = emoji;
          return {
            id: emoji.id,
            // emoji-mart muestra el nombre como globito, así que acá va el texto
            // completo: `:mate: · animado` y, si corresponde, lo de Premium.
            name: tooltip,
            keywords: [emoji.name, server.name],
            skins: [{ src: emojiImageSrc(emoji.image_url) }],
          };
        }),
      });

      if (lockedInCategory === emojis.length)
        lockedCategoryIds.push(categoryId);
    }

    return {
      categories,
      lockedTooltips,
      lockedCategoryIds,
      byId,
      hasLocked: lockedTooltips.length > 0,
    };
  }, [servers, byServer, serverId, isPremium]);
}
