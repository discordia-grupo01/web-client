import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  avatarSrcOf,
  displayNameOf,
  type ProfileSummary,
} from "@/utils/userProfile";
import { cn } from "@/lib/cn";

export interface UserRowAction {
  label: string;
  onClick: () => void;
  /** `danger` para las acciones destructivas (banear). */
  tone?: "default" | "danger";
  isLoading?: boolean;
}

interface UserRowProps {
  userId: string;
  profile: ProfileSummary | null | undefined;
  /** Segunda linea: el motivo del baneo, o nada en la lista de miembros. */
  subtitle?: string;
  actions: UserRowAction[];
  onSelect?: () => void;
  /** Bloquea los botones mientras otra accion de la lista esta en curso. */
  isDisabled?: boolean;
}

/** Un usuario de la lista: avatar, nombre, detalle y sus acciones a la derecha. */
export function UserRow({
  userId,
  profile,
  subtitle,
  actions,
  onSelect,
  isDisabled = false,
}: UserRowProps) {
  const name = displayNameOf(profile);
  const identity = (
    <>
      <Avatar
        name={name}
        src={avatarSrcOf(userId, profile)}
        size={26}
        className="rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="text-content truncate text-sm" title={name}>
          {name}
        </p>
        {subtitle ? (
          <p className="text-content-muted truncate text-xs" title={subtitle}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <li className="bg-surface-raised border-line flex min-w-0 flex-wrap items-center gap-2.5 rounded-xl border px-3 py-2 sm:flex-nowrap">
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Ver perfil de ${name}`}
          className="flex min-w-0 flex-1 basis-40 cursor-pointer items-center gap-2.5 rounded-lg text-left hover:opacity-80"
        >
          {identity}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 basis-40 items-center gap-2.5">
          {identity}
        </div>
      )}
      <div className="ml-auto flex shrink-0 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant="secondary"
            onClick={action.onClick}
            isLoading={action.isLoading}
            disabled={isDisabled}
            className={cn(
              "w-auto px-2.5 py-1 text-xs",
              action.tone === "danger" ? "text-danger" : "text-accent-strong",
            )}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </li>
  );
}
