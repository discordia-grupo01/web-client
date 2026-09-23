"use client";

import {
  BANNER_PRESETS_LABEL,
  PRESET_BANNERS,
  type PresetBanner,
} from "@discordia/client-shared";
import { Check } from "lucide-react";

import { SectionLabel } from "@/components/ui/section-label";
import { presetBannerGradientCss } from "@/lib/preset-banner";
import { cn } from "@/lib/cn";

interface BannerPresetPickerProps {
  selectedId: string | null;
  onSelect: (preset: PresetBanner) => void;
}

/**
 * Los fondos fijos del catalogo compartido, como alternativa a subir una
 * imagen. Se pinta el degradado en CSS y no el PNG del preset porque ese PNG
 * mide 24x8 px; los bytes que se suben siguen siendo los del PNG.
 */
export function BannerPresetPicker({
  selectedId,
  onSelect,
}: BannerPresetPickerProps) {
  return (
    <div>
      <SectionLabel>{BANNER_PRESETS_LABEL}</SectionLabel>

      <div className="mt-2 grid grid-cols-3 gap-2.5">
        {PRESET_BANNERS.map((preset) => {
          const isSelected = preset.id === selectedId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              aria-label={`Fondo ${preset.label}`}
              aria-pressed={isSelected}
              title={preset.label}
              className={cn(
                // El borde de seleccion va como `ring-inset` y no como
                // `border`: un `border-2 border-transparent` sobre un fondo
                // con degradado deja una costura visible en las esquinas
                // redondeadas, porque el navegador compone esa franja aparte.
                "relative h-16 cursor-pointer overflow-hidden rounded-2xl transition-all ring-inset",
                isSelected
                  ? "ring-2 ring-white"
                  : "hover:ring-2 hover:ring-white/40",
              )}
              style={{ background: presetBannerGradientCss(preset) }}
            >
              {isSelected ? (
                <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full border border-white/50 bg-black/55">
                  <Check size={11} className="text-white" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
