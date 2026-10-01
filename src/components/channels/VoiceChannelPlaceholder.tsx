import { VOICE_NOT_IMPLEMENTED } from "@discordia/client-shared";

import { Volume2 } from "lucide-react";

export function VoiceChannelPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="from-accent-gradient-start to-accent-gradient-end flex size-14 items-center justify-center rounded-full bg-gradient-to-br">
        <Volume2 size={26} className="text-white" />
      </div>
      <div>
        <h2 className="font-display text-content text-lg font-bold">
          Canal de voz: {name}
        </h2>
        <p className="text-content-muted mt-1 max-w-sm text-sm leading-relaxed">
          {VOICE_NOT_IMPLEMENTED}
        </p>
      </div>
    </div>
  );
}
