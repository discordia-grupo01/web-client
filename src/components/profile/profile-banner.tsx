import { X } from "lucide-react";

export const PROFILE_BANNER_GRADIENT =
  "linear-gradient(135deg, #0f1f2e 0%, #1a3a4a 40%, #245C6B 70%, #1c293b 100%)";

interface ProfileBannerProps {
  onClose: () => void;
  gradient?: string;
  /** Portada atenuada para estados especiales (perfil suspendido). */
  dimmed?: boolean;
}

/** Portada con degradé + botón de cierre, compartida por los modales de perfil. */
export function ProfileBanner({
  onClose,
  gradient = PROFILE_BANNER_GRADIENT,
  dimmed = false,
}: ProfileBannerProps) {
  return (
    <div className="relative h-[100px]" style={{ background: gradient }}>
      <div
        className="absolute inset-0"
        style={{
          background: dimmed
            ? "rgba(0,0,0,0.55)"
            : "radial-gradient(ellipse at 30% 50%, rgba(36,92,107,0.8) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(252,227,164,0.2) 0%, transparent 50%)",
          opacity: dimmed ? 1 : 0.3,
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-3 right-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/30 transition-transform hover:scale-110"
      >
        <X size={14} className="text-white/80" />
      </button>
    </div>
  );
}
