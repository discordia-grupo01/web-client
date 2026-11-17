import type {
  EmojiUploadErrorField,
  ServerEmoji,
  ServerEmojiPage,
} from "@discordia/client-shared";

/**
 * Formas que devuelve el BFF de emojis (`/api/servers/:id/emojis`).
 */

export type ListServerEmojisResult =
  { ok: true; page: ServerEmojiPage } | { ok: false; message: string };

export type UploadServerEmojiResult =
  | { ok: true; emoji: ServerEmoji }
  | { ok: false; field?: EmojiUploadErrorField; message: string };

export type DeleteServerEmojiResult =
  { ok: true } | { ok: false; message: string };
