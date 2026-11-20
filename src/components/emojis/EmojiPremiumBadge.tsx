import { EMOJI_PREMIUM_REQUIRED_LABEL } from "@discordia/client-shared";

import { DiscordiaPremiumIcon } from "@/components/billing/icons/DiscordiaIcons";
import { cn } from "@/lib/cn";

interface EmojiPremiumBadgeProps {
  /** Lado de la baldosa, en px. El ícono entra con aire adentro. */
  size?: number;
  className?: string;
}

/**
 * Marca un emoji que pide Premium para usarlo (los animados, los de otro
 * servidor y cualquiera en un mensaje directo). Va en la esquina de la imagen.
 *
 * Es el ícono de Premium y no un candado: el candado es de los beneficios que
 * se desbloquean con boosts del servidor, que es otra cosa.
 */
export function EmojiPremiumBadge({
  size = 18,
  className,
}: EmojiPremiumBadgeProps) {
  return (
    <span
      title={EMOJI_PREMIUM_REQUIRED_LABEL}
      style={{ width: size, height: size }}
      className={cn(
        "bg-surface-modal border-amber/50 flex items-center justify-center rounded-md border",
        className,
      )}
    >
      <DiscordiaPremiumIcon size={Math.round(size * 0.6)} />
      <span className="sr-only">{EMOJI_PREMIUM_REQUIRED_LABEL}</span>
    </span>
  );
}
