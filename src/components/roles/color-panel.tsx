"use client";

import { HsvColorPicker, type HsvColor } from "react-colorful";

function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToHsv(hex: string): HsvColor {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return { h, s: (max === 0 ? 0 : delta / max) * 100, v: max * 100 };
}

function hsvToHex({ h, s, v }: HsvColor): string {
  const sat = s / 100;
  const val = v / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface ColorPanelProps {
  hex: string;
  onChange: (hex: string) => void;
}

/**
 * Selector de color con cuadro de saturacion/brillo + barra de tono, via
 * react-colorful. El <input type="color"> nativo en Linux (GTK) abre una
 * grilla de swatches en vez del panel de saturacion/tono y no hay forma de
 * saltear esa pantalla desde el navegador, asi que este panel lo reemplaza.
 */
export function ColorPanel({ hex, onChange }: ColorPanelProps) {
  const hsv = hexToHsv(isValidHex(hex) ? hex : "#000000");

  return (
    <HsvColorPicker
      color={hsv}
      onChange={(next) => onChange(hsvToHex(next))}
      style={{ width: "100%", height: 200 }}
    />
  );
}
