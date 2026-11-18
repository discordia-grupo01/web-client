"use client";

import { COLOR_PALETTE, isValidHex } from "@discordia/client-shared";
import { AlertCircle, Check, Pencil, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ColorPanel } from "../ColorPanel";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <AlertCircle size={13} className="text-danger" />
      <span className="text-danger text-xs">{message}</span>
    </div>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [custom, setCustom] = useState(
    COLOR_PALETTE.includes(value) ? "" : value,
  );
  const [showCustom, setShowCustom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click afuera cierra el panel.
  useEffect(() => {
    if (!showCustom) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowCustom(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showCustom]);

  return (
    <div ref={containerRef} className="relative">
      <div className="grid grid-cols-8 gap-2">
        {COLOR_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => {
              onChange(swatch);
              setShowCustom(false);
            }}
            className="aspect-square w-full cursor-pointer rounded-lg transition-transform hover:scale-110"
            style={{
              background: swatch,
              boxShadow:
                value === swatch
                  ? `0 0 0 2px var(--bg-modal), 0 0 0 4px ${swatch}`
                  : undefined,
            }}
          >
            {value === swatch ? (
              <Check size={12} className="mx-auto text-white" />
            ) : null}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom((prev) => !prev)}
          title="Elegir color personalizado"
          className="border-line-strong text-content-subtle relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-transform hover:scale-110"
          style={{
            background: isValidHex(custom) ? custom : "transparent",
          }}
        >
          {isValidHex(custom) ? <Pencil size={12} /> : <Plus size={14} />}
        </button>
      </div>

      {showCustom ? (
        <div className="bg-surface-raised border-line-strong absolute top-full left-0 z-[70] mt-2 w-full rounded-xl border p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-content-subtle text-xs font-bold tracking-wider uppercase">
              Color personalizado
            </span>
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              aria-label="Cerrar"
              className="text-content-subtle hover:text-content cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <ColorPanel
              hex={isValidHex(custom) ? custom : "#000000"}
              onChange={(next) => {
                setCustom(next);
                onChange(next);
              }}
            />
            <div className="flex items-center gap-2">
              <div
                className="border-line size-8 shrink-0 rounded-lg border"
                style={{
                  background: isValidHex(custom) ? custom : "var(--bg-input)",
                }}
              />
              <div className="bg-surface-input border-line flex flex-1 items-center rounded-xl border px-3 py-2">
                <input
                  type="text"
                  value={custom}
                  onChange={(event) => {
                    const next = event.target.value;
                    setCustom(next);
                    if (isValidHex(next)) onChange(next);
                  }}
                  placeholder="#3d9bb5"
                  maxLength={7}
                  className="text-content min-w-0 flex-1 border-none bg-transparent font-mono text-sm outline-none"
                />
              </div>
              {isValidHex(custom) ? (
                <Check size={14} className="text-success shrink-0" />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
