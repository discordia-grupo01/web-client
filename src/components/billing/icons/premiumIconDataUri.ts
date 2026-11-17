import {
  brandViewBox,
  PREMIUM_BRAND_COLORS as COLORS,
  PREMIUM_ICON,
} from "@discordia/client-shared";

/**
 * El mismo ícono de Premium que dibuja `DiscordiaPremiumIcon`, pero como data
 * URI, para los lugares donde solo se puede poner una imagen de fondo: el
 * selector de emojis de emoji-mart vive en un shadow DOM y no acepta que le
 * metamos componentes adentro.
 *
 * Se arma con los mismos datos de marca que el componente, así el día que
 * cambie el logo cambian los dos.
 */
export function premiumIconDataUri(): string {
  const blocks = PREMIUM_ICON.blocks
    .map(
      (block) =>
        `<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" rx="${block.rx}" fill="${COLORS[block.fill]}"/>`,
    )
    .join("");
  const { d, stroke, strokeWidth } = PREMIUM_ICON.connector;
  const connector = `<path d="${d}" fill="none" stroke="${COLORS[stroke]}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${brandViewBox(PREMIUM_ICON.viewBox)}">${blocks}${connector}</svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
