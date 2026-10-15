/**
 * Cuentas de la grilla de la llamada. La grilla nunca scrollea: los tiles se
 * achican hasta un minimo y, si aun asi no entran todos, el ultimo lugar pasa
 * a ser un "+N" que abre la lista de participantes.
 *
 * Vive en web y no en `client-shared` porque mobile dibuja la llamada con esta
 * misma grilla dentro del WebView de `/voice-embed`.
 */

export const VOICE_TILE_ASPECT = 16 / 9;

export interface VoiceGridOptions {
  gap: number;
  minTileWidth: number;
  maxColumns: number;
}

export interface VoiceGridLayout {
  columns: number;
  tileWidth: number;
  tileHeight: number;
  /** Cuantos tiles entran, contando el "+N" si hace falta. */
  capacity: number;
}

export const WIDE_GRID: VoiceGridOptions = {
  gap: 12,
  minTileWidth: 160,
  maxColumns: 8,
};

export const NARROW_GRID: VoiceGridOptions = {
  gap: 8,
  minTileWidth: 104,
  maxColumns: 3,
};

/** Por debajo de este ancho la llamada usa la grilla de celular. */
export const NARROW_GRID_BREAKPOINT = 560;

function tileWidthFor(
  width: number,
  height: number,
  columns: number,
  rows: number,
  gap: number,
): number {
  const byWidth = (width - gap * (columns - 1)) / columns;
  const byHeight = ((height - gap * (rows - 1)) / rows) * VOICE_TILE_ASPECT;
  // Entero: la grilla es un flex-wrap y un subpixel de mas la haria cortar antes.
  return Math.max(0, Math.floor(Math.min(byWidth, byHeight)));
}

export function voiceGridLayout(
  width: number,
  height: number,
  count: number,
  { gap, minTileWidth, maxColumns }: VoiceGridOptions,
): VoiceGridLayout {
  const total = Math.max(1, count);
  let best = { columns: 1, tileWidth: 0 };
  for (let columns = 1; columns <= Math.min(total, maxColumns); columns++) {
    const rows = Math.ceil(total / columns);
    const tileWidth = tileWidthFor(width, height, columns, rows, gap);
    if (tileWidth > best.tileWidth) best = { columns, tileWidth };
  }

  if (best.tileWidth >= minTileWidth || width <= 0 || height <= 0) {
    return {
      columns: best.columns,
      tileWidth: best.tileWidth,
      tileHeight: best.tileWidth / VOICE_TILE_ASPECT,
      capacity: total,
    };
  }

  const minTileHeight = minTileWidth / VOICE_TILE_ASPECT;
  const columns = Math.max(
    1,
    Math.min(maxColumns, Math.floor((width + gap) / (minTileWidth + gap))),
  );
  const rows = Math.max(1, Math.floor((height + gap) / (minTileHeight + gap)));
  const tileWidth = tileWidthFor(width, height, columns, rows, gap);
  return {
    columns,
    tileWidth,
    tileHeight: tileWidth / VOICE_TILE_ASPECT,
    capacity: columns * rows,
  };
}

/** Cuantos tiles de `tileLength` entran en una tira de `length`, con `gap` entre ellos. */
export function stripCapacity(
  length: number,
  tileLength: number,
  gap: number,
): number {
  return Math.max(1, Math.floor((length + gap) / (tileLength + gap)));
}

interface StageCandidate {
  identity: string;
  isLocal: boolean;
  speaking: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
}

/**
 * A quienes se ve cuando no entran todos (`slots` lugares, sin contar el
 * "+N"). Vos siempre; los que ya se veian se quedan, para que la grilla no
 * salte; si habla alguien de afuera entra en lugar de quien hace mas que no
 * habla. Los huecos se llenan primero con quien tiene camara o pantalla.
 *
 * `spokeAt` es un contador por participante: mas alto, hablo mas reciente.
 * El resultado respeta el orden de `participants`.
 */
export function pickVisibleParticipants<T extends StageCandidate>(
  participants: readonly T[],
  slots: number,
  previous: readonly string[],
  spokeAt: ReadonlyMap<string, number>,
): T[] {
  if (participants.length <= slots) return [...participants];

  const present = new Map(participants.map((p) => [p.identity, p]));
  const chosen = new Set<string>();
  const lastSpoke = (identity: string) => spokeAt.get(identity) ?? 0;

  const local = participants.find((p) => p.isLocal);
  if (local) chosen.add(local.identity);
  for (const identity of previous) {
    if (chosen.size >= slots) break;
    if (present.has(identity)) chosen.add(identity);
  }

  const outsideSpeakers = participants
    .filter((p) => p.speaking && !chosen.has(p.identity))
    .sort((a, b) => lastSpoke(b.identity) - lastSpoke(a.identity));
  for (const speaker of outsideSpeakers) {
    if (chosen.size < slots) {
      chosen.add(speaker.identity);
      continue;
    }
    const quietest = participants
      .filter(
        (p) =>
          chosen.has(p.identity) &&
          !p.isLocal &&
          !p.speaking &&
          !p.screenSharing,
      )
      .sort((a, b) => lastSpoke(a.identity) - lastSpoke(b.identity))[0];
    if (!quietest) break;
    chosen.delete(quietest.identity);
    chosen.add(speaker.identity);
  }

  const hasVideo = (p: T) => p.cameraOn || p.screenSharing;
  const fillers = participants
    .filter((p) => !chosen.has(p.identity))
    .sort((a, b) => Number(hasVideo(b)) - Number(hasVideo(a)));
  for (const filler of fillers) {
    if (chosen.size >= slots) break;
    chosen.add(filler.identity);
  }

  return participants.filter((p) => chosen.has(p.identity));
}
