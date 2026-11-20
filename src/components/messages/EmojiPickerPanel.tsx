"use client";

import { CUSTOM_EMOJI_PICKER_COPY } from "@discordia/client-shared";
import i18n from "@emoji-mart/data/i18n/es.json";
import data from "@emoji-mart/data/sets/15/native.json";
import Picker from "@emoji-mart/react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { premiumIconDataUri } from "@/components/billing/icons/premiumIconDataUri";
import { useTheme } from "@/hooks/useTheme";

import type { CustomEmojiCategory } from "./hooks/useCustomEmojiPicker";
import { keepCustomCategories } from "./utils/emojiMartCategories";

/** Lo que devuelve emoji-mart al elegir: los del servidor traen `src` y no `native`. */
interface PickedEmoji {
  id: string;
  name: string;
  native?: string;
  src?: string;
}

/** Las de emoji-mart, en su orden; las de los servidores van antes, tras los usados. */
const STANDARD_CATEGORIES = [
  "people",
  "nature",
  "foods",
  "activity",
  "places",
  "objects",
  "symbols",
  "flags",
];

/** Cuántos frames esperarle el shadow root a emoji-mart antes de dejarlo. */
const SHADOW_ROOT_ATTEMPTS = 10;

interface EmojiPickerPanelProps {
  onPick: (emoji: string) => void;
  /** Un emoji del servidor: se elige por id para escribirlo como `:nombre:`. */
  onPickCustom?: (id: string) => void;
  perLine?: number;
  custom?: CustomEmojiCategory[];
  /** Globitos de los que piden Premium: llevan la insignia en la baldosa. */
  lockedTooltips?: string[];
  /** Categorías sin nada usable: llevan el cartel de Premium en su título. */
  lockedCategoryIds?: string[];
}

/**
 * Un texto como literal de CSS. El globito de un emoji bloqueado tiene dos
 * renglones, y un salto de línea crudo adentro de unas comillas no es CSS
 * válido: el navegador descarta la regla y se pierden todas las insignias.
 */
function cssString(value: string): string {
  return value
    .replace(/["\\]/g, (char) => `\\${char}`)
    .replace(/\n/g, "\\00000a");
}

/**
 * emoji-mart dibuja adentro de un shadow DOM, así que nuestras clases no llegan
 * a las baldosas ni a los títulos. Para marcar lo que pide Premium se le mete
 * una hoja de estilo al shadow root, que apunta a los botones por su `title`
 * (el globito que arma emoji-mart con el nombre) y a las categorías por su
 * `data-id`.
 *
 * Si algún día cambia ese detalle interno, lo único que se pierde son las
 * marcas: elegir uno bloqueado sigue mostrando la oferta de Premium.
 */
function premiumMarksCss(
  tooltips: readonly string[],
  categoryIds: readonly string[],
): string {
  const rules: string[] = [];
  const icon = premiumIconDataUri();

  if (tooltips.length > 0) {
    const buttons = tooltips.map(
      (title) => `button[title="${cssString(title)}"]`,
    );
    // El `::after` va pegado a cada selector: colgado de la lista entera se
    // aplicaría solo al último, y a todos los demás la insignia les pintaría
    // el borde y el fondo sobre la baldosa.
    rules.push(`
${buttons.join(",")} { position: relative; }
${buttons.map((button) => `${button}::after`).join(",")} {
  content: "";
  position: absolute;
  top: 1px;
  right: 1px;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(240, 178, 50, 0.6);
  background-color: #1C293B;
  background-image: ${icon};
  background-repeat: no-repeat;
  background-position: center;
  background-size: 10px 10px;
}`);
  }

  for (const id of categoryIds) {
    rules.push(`
.category[data-id="${cssString(id)}"] .sticky {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.category[data-id="${cssString(id)}"] .sticky::after {
  content: "${cssString(CUSTOM_EMOJI_PICKER_COPY.categoryTag)}";
  color: var(--amber);
  font-size: 11px;
  font-weight: 700;
  padding-left: 17px;
  background-image: ${icon};
  background-repeat: no-repeat;
  background-position: left center;
  background-size: 13px 13px;
}`);
  }

  return rules.join("\n");
}

export default function EmojiPickerPanel({
  onPick,
  onPickCustom,
  perLine,
  custom,
  lockedTooltips,
  lockedCategoryIds,
}: EmojiPickerPanelProps) {
  const { theme } = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const categories = custom?.length
    ? [
        "frequent",
        ...custom.map((category) => category.id),
        ...STANDARD_CATEGORIES,
      ]
    : undefined;
  const marksKey = JSON.stringify([
    lockedTooltips ?? [],
    lockedCategoryIds ?? [],
  ]);

  /**
   * Un `<Picker>` ya montado ignora lo que le llegue después: emoji-mart arma
   * sus categorías una sola vez, al construirse. Como los emojis de los
   * servidores se piden recién al abrir el selector, se lo vuelve a montar
   * cada vez que cambia el catálogo (al terminar de cargar, al subir uno, al
   * entrar o salir de un servidor).
   */
  const pickerKey = useMemo(
    () =>
      (custom ?? [])
        .map(
          (category) =>
            `${category.id}:${category.emojis.map((emoji) => emoji.id).join(",")}`,
        )
        .join("|"),
    [custom],
  );

  // Corre antes de que se construya el `<Picker>`, que lo hace en un efecto
  // común: los de layout van siempre primero.
  useLayoutEffect(() => {
    keepCustomCategories(custom ?? []);
  }, [custom]);

  useEffect(() => {
    const [tooltips, categoryIds] = JSON.parse(marksKey) as [
      string[],
      string[],
    ];
    const css = premiumMarksCss(tooltips, categoryIds);
    if (css === "") return;

    let style: HTMLStyleElement | null = null;
    let frame = 0;
    let attempts = 0;

    // El elemento se monta en el próximo frame: emoji-mart lo crea a mano y
    // recién después le cuelga el shadow root, así que se reintenta un rato
    // en vez de perder las marcas por llegar un frame antes.
    const inject = () => {
      const root =
        hostRef.current?.querySelector("em-emoji-picker")?.shadowRoot;
      if (!root) {
        attempts += 1;
        if (attempts < SHADOW_ROOT_ATTEMPTS) {
          frame = requestAnimationFrame(inject);
        }
        return;
      }
      style = document.createElement("style");
      style.textContent = css;
      root.appendChild(style);
    };
    frame = requestAnimationFrame(inject);

    return () => {
      cancelAnimationFrame(frame);
      style?.remove();
    };
  }, [marksKey, theme, perLine, pickerKey]);

  return (
    <div ref={hostRef}>
      <Picker
        key={pickerKey}
        data={data}
        i18n={i18n}
        locale="es"
        set="native"
        theme={theme}
        previewPosition="none"
        perLine={perLine}
        custom={custom}
        categories={categories}
        skinTonePosition="search"
        onEmojiSelect={(emoji: PickedEmoji) => {
          if (emoji.native) {
            onPick(emoji.native);
            return;
          }
          onPickCustom?.(emoji.id);
        }}
      />
    </div>
  );
}
