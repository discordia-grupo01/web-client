"use client";

import {
  BANNER_PRESETS_LABEL,
  BOOST_PERK_LEVEL,
  boostLevelLabel,
  boostPerkAvailableFrom,
  boostPerkLevelLabel,
  PRESET_BANNERS,
  type PresetBanner,
} from "@discordia/client-shared";
import { Check } from "lucide-react";

import { BoostLevelIcon } from "@/components/boosts/BoostLevelIcon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { presetBannerGradientCss } from "@/components/servers/utils/presetBanner";
import { cn } from "@/lib/cn";

interface BannerPresetPickerProps {
  selectedId: string | null;
  isLocked: boolean;
  onSelect: (preset: PresetBanner) => void;
}

/**
 * Los fondos fijos del catalogo compartido, como alternativa a subir una
 * imagen. Se pinta el degradado en CSS y no el PNG del preset porque ese PNG
 * mide 24x8 px; los bytes que se suben siguen siendo los del PNG.
 */
export function BannerPresetPicker({
  selectedId,
  isLocked,
  onSelect,
}: BannerPresetPickerProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>{BANNER_PRESETS_LABEL}</SectionLabel>
        {isLocked ? (
          <span
            title={boostPerkAvailableFrom("custom_banner")}
            className="border-line bg-surface-input text-content-muted flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold"
          >
            <BoostLevelIcon level={BOOST_PERK_LEVEL.custom_banner} size={14} />
            {boostLevelLabel(BOOST_PERK_LEVEL.custom_banner)}
          </span>
        ) : (
          <span title={boostPerkLevelLabel("custom_banner")} className="flex">
            <BoostLevelIcon level={BOOST_PERK_LEVEL.custom_banner} size={18} />
            <span className="sr-only">
              {boostPerkLevelLabel("custom_banner")}
            </span>
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2.5">
        {PRESET_BANNERS.map((preset) => {
          const isSelected = preset.id === selectedId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              disabled={isLocked}
              aria-label={`Fondo ${preset.label}`}
              aria-pressed={isSelected}
              title={
                isLocked
                  ? boostPerkAvailableFrom("custom_banner")
                  : preset.label
              }
              className={cn(
                // El borde de seleccion va como `ring-inset` y no como
                // `border`: un `border-2 border-transparent` sobre un fondo
                // con degradado deja una costura visible en las esquinas
                // redondeadas, porque el navegador compone esa franja aparte.
                "relative h-16 overflow-hidden rounded-2xl transition-all ring-inset",
                isLocked
                  ? "cursor-not-allowed opacity-35 grayscale-[40%]"
                  : isSelected
                    ? "cursor-pointer ring-2 ring-white"
                    : "cursor-pointer hover:ring-2 hover:ring-white/40",
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
