import { type PresetBanner } from "@discordia/client-shared";

/**
 * Lo propio de web para usar un fondo fijo del servidor. El catalogo
 * (`PRESET_BANNERS`) vive en `@discordia/client-shared`; esto es la mitad que
 * depende del navegador y que por eso no puede vivir alla. En app-mobile el
 * equivalente es `materializePresetBanner`, que escribe el mismo base64 a un
 * archivo de cache porque alla se sube por ruta.
 */

/**
 * El degradado del preset en sintaxis CSS.
 *
 * Se dibuja el degradado en vez del PNG del preset porque ese PNG mide 24x8
 * px: estirado al ancho del modal se ve con bandas. Los bytes que se suben
 * siguen siendo los del PNG (ver `presetBannerFile`), que es lo que el backend
 * guarda y despues sirve a todos los miembros.
 */
export function presetBannerGradientCss(preset: PresetBanner): string {
  const stops = preset.colors
    .map((color, index) => {
      // `0.58 * 100` da 57.99999999999999 en coma flotante, y ese numero
      // terminaria literal dentro del CSS.
      const percent = Number((preset.locations[index] * 100).toFixed(2));
      return `${color} ${percent}%`;
    })
    .join(", ");
  return `linear-gradient(135deg, ${stops})`;
}

/**
 * Convierte el preset en el `File` que se sube en el multipart. `fetch` de un
 * data URL es la forma mas corta de volver bytes el base64 sin escribir un
 * decodificador a mano.
 */
export async function presetBannerFile(preset: PresetBanner): Promise<File> {
  const response = await fetch(`data:image/png;base64,${preset.base64}`);
  const blob = await response.blob();
  return new File([blob], `${preset.id}.png`, { type: "image/png" });
}
