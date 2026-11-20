import {
  EMOJI_ANIMATED_BADGE,
  EMOJI_DELETE_COPY,
  EMOJIS_EMPTY_NOTICE,
  emojiAuthorLabel,
  emojiLabel,
  formatDayAndMonth,
  type ServerEmoji,
} from "@discordia/client-shared";
import { Smile, Trash2 } from "lucide-react";

import { SettingsEmptyState } from "@/components/ui/settings/SettingsEmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { emojiImageSrc } from "@/utils/image-urls";

import { EmojiPremiumBadge } from "./EmojiPremiumBadge";

interface ServerEmojiListProps {
  emojis: ServerEmoji[];
  /**
   * Nombre por `user_id`. `null` mientras no se cargaron los miembros: ahi la
   * fila muestra solo la fecha, porque decir "un exmiembro" sin saberlo
   * seria mentir.
   */
  authorNames: Record<string, string> | null;
  canManage: boolean;
  /** Sin Premium, los animados llevan la insignia: se ven, pero no se usan. */
  isPremium: boolean;
  onDelete: (emoji: ServerEmoji) => void;
}

function authorLine(
  emoji: ServerEmoji,
  authorNames: Record<string, string> | null,
): string {
  if (authorNames === null) return formatDayAndMonth(emoji.created_at);
  return emojiAuthorLabel(
    authorNames[emoji.created_by] ?? null,
    emoji.created_at,
  );
}

/** Del mas viejo al mas nuevo, como los manda el back. */
export function ServerEmojiList({
  emojis,
  authorNames,
  canManage,
  isPremium,
  onDelete,
}: ServerEmojiListProps) {
  if (emojis.length === 0) {
    return <SettingsEmptyState icon={Smile} text={EMOJIS_EMPTY_NOTICE} />;
  }

  return (
    <ul className="border-line divide-line divide-y rounded-xl border">
      {emojis.map((emoji) => (
        <li
          key={emoji.id}
          className="flex items-center gap-3 px-3.5 py-2.5 first:rounded-t-xl last:rounded-b-xl"
        >
          <span className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- el host de la imagen sale del back (Supabase o el gateway), no hay dominio fijo para next/image */}
            <img
              src={emojiImageSrc(emoji.image_url)}
              alt={emojiLabel(emoji.name)}
              width={32}
              height={32}
              className="size-8 rounded object-contain"
            />
            {emoji.animated && !isPremium ? (
              <EmojiPremiumBadge
                size={16}
                className="absolute -top-1.5 -right-1.5"
              />
            ) : null}
          </span>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-content truncate text-sm font-semibold">
                {emojiLabel(emoji.name)}
              </span>
              {emoji.animated ? (
                <span className="text-boost-warn bg-boost-warn-soft border-boost-warn-line shrink-0 rounded-md border px-1.5 text-[10px] font-bold">
                  {EMOJI_ANIMATED_BADGE}
                </span>
              ) : null}
            </div>
            <span className="text-content-subtle truncate text-xs">
              {authorLine(emoji, authorNames)}
            </span>
          </div>

          {canManage ? (
            <Tooltip label={EMOJI_DELETE_COPY.confirm}>
              <button
                type="button"
                onClick={() => onDelete(emoji)}
                aria-label={`${EMOJI_DELETE_COPY.confirm} ${emojiLabel(emoji.name)}`}
                className="text-content-subtle hover:text-danger hover:bg-danger-soft flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </Tooltip>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
