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

export type VoiceFocusMode = "side" | "bottom" | "stacked";

export interface VoiceFocusLayout {
  mode: VoiceFocusMode;
  stageWidth: number;
  stageHeight: number;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  capacity: number;
}

const FOCUS_GAP = 8;
const SIDE_STRIP_MIN_WIDTH = 900;
const SIDE_STRIP_TILE_WIDTH = 176;
const BOTTOM_STRIP_TILE_HEIGHT = 90;
const STACKED_STAGE_SHARE = 0.55;

function fitStage(width: number, height: number) {
  const stageWidth = Math.max(0, Math.min(width, height * VOICE_TILE_ASPECT));
  return { stageWidth, stageHeight: stageWidth / VOICE_TILE_ASPECT };
}

export function voiceFocusLayout(
  width: number,
  height: number,
  othersCount: number,
  isNarrow: boolean,
): VoiceFocusLayout {
  if (!isNarrow && width >= SIDE_STRIP_MIN_WIDTH) {
    const tileHeight = SIDE_STRIP_TILE_WIDTH / VOICE_TILE_ASPECT;
    const stripWidth = othersCount > 0 ? SIDE_STRIP_TILE_WIDTH + FOCUS_GAP : 0;
    return {
      mode: "side",
      ...fitStage(width - stripWidth, height),
      tileWidth: SIDE_STRIP_TILE_WIDTH,
      tileHeight,
      columns: 1,
      capacity: stripCapacity(height, tileHeight, FOCUS_GAP),
    };
  }

  if (!isNarrow) {
    const tileWidth = BOTTOM_STRIP_TILE_HEIGHT * VOICE_TILE_ASPECT;
    const stripHeight =
      othersCount > 0 ? BOTTOM_STRIP_TILE_HEIGHT + FOCUS_GAP : 0;
    const capacity = stripCapacity(width, tileWidth, FOCUS_GAP);
    return {
      mode: "bottom",
      ...fitStage(width, height - stripHeight),
      tileWidth,
      tileHeight: BOTTOM_STRIP_TILE_HEIGHT,
      columns: capacity,
      capacity,
    };
  }

  const stage = fitStage(
    width,
    othersCount > 0 ? height * STACKED_STAGE_SHARE : height,
  );
  const remaining = height - stage.stageHeight - FOCUS_GAP;
  const grid = voiceGridLayout(width, remaining, othersCount, NARROW_GRID);
  const tileWidth = Math.min(
    grid.tileWidth,
    Math.floor((width - FOCUS_GAP) / 2),
  );
  const shown = Math.min(othersCount, grid.capacity);
  const columns = Math.max(
    1,
    Math.min(shown, Math.floor((width + FOCUS_GAP) / (tileWidth + FOCUS_GAP))),
  );
  return {
    mode: "stacked",
    ...stage,
    tileWidth,
    tileHeight: tileWidth / VOICE_TILE_ASPECT,
    columns,
    capacity: grid.capacity,
  };
}
