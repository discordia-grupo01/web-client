import { type ServerSummary } from "@discordia/client-shared";
import { Check, Hash, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/Button";

import { ServerIconPlaceholder } from "./ServerIconPlaceholder";

interface CreateServerSuccessProps {
  server: ServerSummary;
  iconPreviewUrl: string | null;
  onContinue: () => void;
}

export function CreateServerSuccess({
  server,
  iconPreviewUrl,
  onContinue,
}: CreateServerSuccessProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-8 text-center">
      <div className="bg-surface border-line-strong w-full overflow-hidden rounded-2xl border">
        <div className="bg-surface-sunken border-line flex items-center gap-3 border-b px-4 py-3">
          {iconPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconPreviewUrl}
              alt=""
              className="size-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <ServerIconPlaceholder name={server.name} size={36} />
          )}
          <span className="font-display text-content truncate text-sm font-bold">
            {server.name}
          </span>
        </div>
        <div className="space-y-0.5 px-3 py-3">
          {server.channels.map((channel) => (
            <div
              key={channel.id}
              className="bg-surface-input flex items-center gap-2 rounded-lg px-2 py-1.5"
            >
              {channel.kind === "text" ? (
                <Hash size={15} className="text-content-subtle" />
              ) : (
                <Volume2 size={15} className="text-content-subtle" />
              )}
              <span className="text-content-muted text-sm">{channel.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="bg-success/15 text-success flex size-12 items-center justify-center rounded-2xl">
          <Check size={26} />
        </div>
        <p className="font-display text-content text-base font-bold">
          ¡Servidor creado!
        </p>
        <p className="text-content-muted max-w-[260px] text-sm leading-relaxed">
          <strong className="text-content">{server.name}</strong> ya está listo.
          Encontrás tus canales en la barra lateral.
        </p>
      </div>

      <Button type="button" onClick={onContinue}>
        Ir al servidor
      </Button>
    </div>
  );
}
