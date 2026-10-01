import { Button } from "@/components/ui/Button";
import { ServerAvatar } from "@/components/ui/ServerAvatar";
import {
  avatarSrcOf,
  displayNameOf,
  type ProfileSummary,
} from "@/lib/userProfile";
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
  /** Bloquea los botones mientras otra accion de la lista esta en curso. */
  isDisabled?: boolean;
}

/** Un usuario de la lista: avatar, nombre, detalle y sus acciones a la derecha. */
export function UserRow({
  userId,
  profile,
  subtitle,
  actions,
  isDisabled = false,
}: UserRowProps) {
  const name = displayNameOf(profile);

  return (
    <li className="bg-surface-raised border-line flex min-w-0 flex-wrap items-center gap-3 rounded-xl border p-3 sm:flex-nowrap">
      <ServerAvatar
        name={name}
        src={avatarSrcOf(userId, profile)}
        size={40}
        className="rounded-full"
      />
      <div className="min-w-0 flex-1 basis-40">
        <p
          className="font-display text-content truncate font-semibold"
          title={name}
        >
          {name}
        </p>
        {subtitle ? (
          <p className="text-content-muted line-clamp-2 text-xs leading-relaxed break-words">
            {subtitle}
          </p>
        ) : null}
      </div>
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
              "w-auto px-3 py-2 text-xs",
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
