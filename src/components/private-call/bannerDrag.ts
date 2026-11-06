export interface Offset {
  x: number;
  y: number;
}

export interface DragBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function dragBoundsOf({
  banner,
  viewport,
  margin,
}: {
  banner: Frame;
  viewport: { width: number; height: number };
  margin: number;
}): DragBounds {
  return {
    minX: margin - banner.x,
    maxX: viewport.width - margin - (banner.x + banner.width),
    minY: margin - banner.y,
    maxY: viewport.height - margin - (banner.y + banner.height),
  };
}

export function clampOffset(offset: Offset, bounds: DragBounds): Offset {
  return {
    x: clamp(offset.x, bounds.minX, bounds.maxX),
    y: clamp(offset.y, bounds.minY, bounds.maxY),
  };
}

export function exceedsDragThreshold(delta: Offset, threshold: number) {
  return Math.abs(delta.x) > threshold || Math.abs(delta.y) > threshold;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
