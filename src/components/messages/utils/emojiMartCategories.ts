import { Data } from "emoji-mart";

import type { CustomEmojiCategory } from "../hooks/useCustomEmojiPicker";

/** Una categoría como la guarda emoji-mart: solo las propias traen nombre. */
interface EmojiMartCategory {
  id: string;
  name?: string;
}

/**
 * emoji-mart guarda las categorías en un único objeto global y las arma de
 * nuevo cada vez que se construye un `<Picker>`. Cuando se le pasa `categories`
 * para elegir el orden de las solapas, filtra contra `originalCategories`: una
 * lista que queda congelada en el primer armado de la página y que solo
 * contiene categorías propias si ya existían en ese momento.
 *
 * Como los emojis de los servidores se piden recién al abrir el selector, ese
 * primer armado nunca las tiene, así que las solapas por servidor desaparecen
 * y no vuelven más. Acá se mantiene esa lista al día justo antes de cada
 * armado: se reemplazan las categorías propias por las de ahora, se sacan las
 * de los servidores donde ya no está la persona y se agregan las nuevas. Con
 * eso el orden sale como en el diseño (los servidores después de "usados con
 * frecuencia") y el contenido es el actual, no el de la primera apertura.
 *
 * Si algún día emoji-mart arregla ese filtro, esto deja de hacer falta pero no
 * molesta: solo reescribe la lista con lo mismo que ya se le pasa por props.
 */
export function keepCustomCategories(custom: CustomEmojiCategory[]): void {
  const data: { originalCategories?: EmojiMartCategory[] } | null = Data;
  const original = data?.originalCategories;
  if (!original) return;

  const fresh = new Map(custom.map((category) => [category.id, category]));
  const kept = original.filter(
    (category) => !category.name || fresh.has(category.id),
  );
  const keptIds = new Set(kept.map((category) => category.id));

  data.originalCategories = [
    ...kept.map((category) =>
      category.name ? (fresh.get(category.id) ?? category) : category,
    ),
    ...custom.filter((category) => !keptIds.has(category.id)),
  ];
}
