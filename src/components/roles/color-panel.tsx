"use client";

import { useEffect, useRef, useState } from "react";

interface Hsv {
  h: number;
  s: number;
  v: number;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function hexToHsv(hex: string): Hsv {
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

  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
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

function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

interface ColorPanelProps {
  hex: string;
  onChange: (hex: string) => void;
}

/**
 * Selector de color con cuadro de saturacion/brillo + barra de tono, tipo
 * Discord. Hecho a mano (sin librerias): el <input type="color"> nativo abre
 * el dialogo del sistema operativo (GTK en Linux), que arranca en una grilla
 * de swatches en vez del panel de saturacion/tono -- no hay forma de
 * saltear esa pantalla desde el navegador, asi que este panel reemplaza al
 * nativo por completo.
 */
export function ColorPanel({ hex, onChange }: ColorPanelProps) {
  const [hsv, setHsv] = useState<Hsv>(() =>
    hexToHsv(isValidHex(hex) ? hex : "#000000"),
  );
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  // Si el hex llega de afuera (p. ej. lo tipearon a mano en el campo de
  // texto) y no coincide con el hsv actual, resincronizamos.
  useEffect(() => {
    if (!isValidHex(hex)) return;
    if (hsvToHex(hsv).toLowerCase() !== hex.toLowerCase()) {
      setHsv(hexToHsv(hex));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hex]);

  function updateFromSv(clientX: number, clientY: number) {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next: Hsv = {
      ...hsv,
      s: clamp01((clientX - rect.left) / rect.width),
      v: clamp01(1 - (clientY - rect.top) / rect.height),
    };
    setHsv(next);
    onChange(hsvToHex(next));
  }

  function updateFromHue(clientX: number) {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next: Hsv = {
      ...hsv,
      h: clamp01((clientX - rect.left) / rect.width) * 360,
    };
    setHsv(next);
    onChange(hsvToHex(next));
  }

  function bindDrag(onMove: (x: number, y: number) => void) {
    return (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      onMove(event.clientX, event.clientY);

      function handleMove(moveEvent: PointerEvent) {
        onMove(moveEvent.clientX, moveEvent.clientY);
      }
      function handleUp() {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      }
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    };
  }

  const hueColor = `hsl(${hsv.h}, 100%, 50%)`;
  const thumbColor = hsvToHex(hsv);

  return (
    <div className="space-y-3">
      <div
        ref={svRef}
        onPointerDown={bindDrag(updateFromSv)}
        className="relative h-36 w-full cursor-crosshair touch-none rounded-lg"
        style={{ background: hueColor }}
      >
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: "linear-gradient(to right, #fff, rgba(255,255,255,0))",
          }}
        />
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: "linear-gradient(to top, #000, rgba(0,0,0,0))",
          }}
        />
        <div
          className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: thumbColor,
          }}
        />
      </div>

      <div
        ref={hueRef}
        onPointerDown={bindDrag((x) => updateFromHue(x))}
        className="relative h-3 w-full cursor-pointer touch-none rounded-full"
        style={{
          background:
            "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
      >
        <div
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
          style={{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }}
        />
      </div>
    </div>
  );
}
