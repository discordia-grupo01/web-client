import {
  type CustomEmojiRef,
  matchPickedEmojis,
  messageCodeRanges,
} from "@discordia/client-shared";

/** Un `:nombre:` del borrador que se dibuja con la imagen de su emoji al lado. */
export interface EmojiPreview {
  start: number;
  end: number;
  src: string;
}

/**
 * Los tramos del borrador que son un emoji del servidor, con su imagen.
 *
 * Se marcan exactamente los mismos que `encodeDraft` va a convertir en token al
 * enviar: los elegidos del selector, fuera de los bloques de código. Así lo que
 * se ve con imagen es lo que efectivamente va a viajar como emoji, y un
 * `:mate:` escrito a mano se queda como texto, que es como lo trata el back.
 */
export function emojiPreviews(
  draft: string,
  picked: readonly CustomEmojiRef[],
  srcOf: (id: string) => string | null,
): EmojiPreview[] {
  return matchPickedEmojis(draft, picked, messageCodeRanges(draft)).flatMap(
    ({ start, end, emoji }) => {
      const src = srcOf(emoji.id);
      return src === null ? [] : [{ start, end, src }];
    },
  );
}
