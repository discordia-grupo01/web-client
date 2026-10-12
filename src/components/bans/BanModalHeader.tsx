import { ShieldBan, type LucideIcon } from "lucide-react";

interface BanModalHeaderProps {
  titleId: string;
  title: string;
  subtitle: string;
  /** Icono de la accion; por defecto el de baneo. */
  icon?: LucideIcon;
}

/** Encabezado de los modales de moderacion: icono, titulo y subtitulo. */
export function BanModalHeader({
  titleId,
  title,
  subtitle,
  icon: Icon = ShieldBan,
}: BanModalHeaderProps) {
  return (
    <div className="border-line flex shrink-0 items-center gap-3 border-b px-5 py-5 pr-16 sm:px-7">
      <div className="bg-danger/15 text-danger flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <h2
          id={titleId}
          className="font-display text-content text-lg leading-tight font-bold"
        >
          {title}
        </h2>
        <p className="text-content-muted text-xs">{subtitle}</p>
      </div>
    </div>
  );
}
