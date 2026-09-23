"use client";

import {
  ADD_BANNER_LABEL,
  ALLOWED_SERVER_ICON_TYPES,
  CHANGE_BANNER_LABEL,
  CHANGE_SERVER_ICON_LABEL,
  REMOVE_BANNER_LABEL,
} from "@discordia/client-shared";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { useRef, type RefObject } from "react";

import { ServerAvatar } from "@/components/ui/server-avatar";
import { ServerBanner } from "@/components/ui/server-banner";

const BANNER_HEIGHT = 120;
const ICON_SIZE = 84;
/** Aro del color del modal que separa el avatar del banner. */
const ICON_RING = 4;
const ICON_BOX = ICON_SIZE + ICON_RING * 2;

const ACCEPTED_TYPES = ALLOWED_SERVER_ICON_TYPES.join(",");

function HiddenImageInput({
  inputRef,
  onPick,
}: {
  inputRef: RefObject<HTMLInputElement>;
  onPick: (file: File) => void;
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_TYPES}
      className="hidden"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onPick(file);
        // Limpiar el input permite volver a elegir el mismo archivo despues
        // de descartarlo (si no, el `change` no dispara).
        event.target.value = "";
      }}
    />
  );
}

interface ServerIdentityEditorProps {
  serverName: string;
  iconSrc: string | null;
  bannerSrc: string | null;
  bannerGradient: string | null;
  hasBanner: boolean;
  onPickIcon: (file: File) => void;
  onPickBanner: (file: File) => void;
  onRemoveBanner: () => void;
}

/**
 * Banner + icono del servidor, con el avatar montado sobre el borde inferior
 * del banner. Los dos se cambian clickeandolos; el banner ademas se puede
 * quitar con la cruz de arriba a la izquierda.
 */
export function ServerIdentityEditor({
  serverName,
  iconSrc,
  bannerSrc,
  bannerGradient,
  hasBanner,
  onPickIcon,
  onPickBanner,
  onRemoveBanner,
}: ServerIdentityEditorProps) {
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="relative"
      style={{ height: BANNER_HEIGHT + ICON_BOX / 2 }}
      // El avatar sale del banner: sin esto el contenedor lo recorta.
    >
      <button
        type="button"
        onClick={() => bannerInputRef.current?.click()}
        aria-label={hasBanner ? CHANGE_BANNER_LABEL : ADD_BANNER_LABEL}
        className="bg-surface-raised border-line-strong relative w-full cursor-pointer overflow-hidden rounded-2xl border"
        style={{ height: BANNER_HEIGHT }}
      >
        <ServerBanner src={bannerSrc} gradient={bannerGradient} />

        {hasBanner ? null : (
          <span className="text-content-subtle absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[11px]">
            <ImageIcon size={20} />
            {ADD_BANNER_LABEL}
          </span>
        )}

        <span className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-black/55">
          <Camera size={13} className="text-white" />
        </span>
      </button>

      {hasBanner ? (
        <button
          type="button"
          onClick={onRemoveBanner}
          aria-label={REMOVE_BANNER_LABEL}
          title={REMOVE_BANNER_LABEL}
          // Mismo velo negro que la camara de la derecha, igual que en
          // app-mobile: sobre una foto cualquiera el circulo rojo pesaba
          // demasiado para una accion que se puede deshacer cancelando.
          className="absolute top-2.5 left-2.5 flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/55 transition-colors hover:bg-black/75"
        >
          <X size={13} className="text-white" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => iconInputRef.current?.click()}
        aria-label={CHANGE_SERVER_ICON_LABEL}
        title={CHANGE_SERVER_ICON_LABEL}
        className="group absolute bottom-0 left-4 flex cursor-pointer items-center justify-center rounded-full"
        style={{
          width: ICON_BOX,
          height: ICON_BOX,
          background: "var(--bg-modal)",
        }}
      >
        <ServerAvatar
          name={serverName}
          src={iconSrc}
          size={ICON_SIZE}
          className="rounded-full"
        />
        <span className="absolute inset-0 m-1 flex items-center justify-center rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera size={20} className="text-white" />
        </span>
        <span
          className="absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full border-2 bg-black/65"
          style={{ borderColor: "var(--bg-modal)" }}
        >
          <Camera size={11} className="text-white" />
        </span>
      </button>

      <HiddenImageInput inputRef={iconInputRef} onPick={onPickIcon} />
      <HiddenImageInput inputRef={bannerInputRef} onPick={onPickBanner} />
    </div>
  );
}
