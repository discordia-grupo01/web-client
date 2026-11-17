import { getInitial, THEMES } from "@discordia/client-shared";

/** El degradado de marca, para el servidor que no subió ícono. */
const { accentGradientStart, accentGradientEnd, onAccent } = THEMES.dark;

function xmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * El ícono de la solapa de un servidor en el selector de emojis.
 *
 * Hace falta uno para cada servidor, y no alcanza con el `categoryIcons` de
 * emoji-mart: cuando una categoría propia no trae `icon`, emoji-mart la mete
 * adentro de la solapa de la anterior, así que todos los servidores quedarían
 * amontonados en una sola. El `categoryIcons` lo aplica más tarde, cuando esa
 * decisión ya está tomada.
 *
 * El que no tiene imagen lleva su inicial sobre el degradado, igual que
 * `Avatar`, pero dibujada como data URI: la barra del selector vive en un
 * shadow DOM y solo sabe mostrar una imagen. El degradado es el mismo en los
 * dos temas, así que se usa el del oscuro para los dos.
 */
export function serverCategoryIcon({
  name,
  iconSrc,
}: {
  name: string;
  iconSrc: string | null;
}): { src: string } {
  if (iconSrc) return { src: iconSrc };

  const initial = xmlText(getInitial(name) ?? "?");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accentGradientStart}"/><stop offset="1" stop-color="${accentGradientEnd}"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#g)"/><text x="16" y="17" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="${onAccent}">${initial}</text></svg>`;

  return { src: `data:image/svg+xml,${encodeURIComponent(svg)}` };
}
