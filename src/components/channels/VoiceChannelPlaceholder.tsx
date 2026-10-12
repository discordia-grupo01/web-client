import {
  VOICE_CONNECT_FORBIDDEN,
  VOICE_NOT_IMPLEMENTED,
} from "@discordia/client-shared";

import { Volume2, VolumeX } from "lucide-react";

interface VoiceChannelPlaceholderProps {
  name: string;
  canConnect: boolean;
}

export function VoiceChannelPlaceholder({
  name,
  canConnect,
}: VoiceChannelPlaceholderProps) {
  const Icon = canConnect ? Volume2 : VolumeX;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="from-accent-gradient-start to-accent-gradient-end flex size-14 items-center justify-center rounded-full bg-gradient-to-br">
        <Icon size={26} className="text-white" />
      </div>
      <div>
        <h2 className="font-display text-content text-lg font-bold">
          Canal de voz: {name}
        </h2>
        <p className="text-content-muted mt-1 max-w-sm text-sm leading-relaxed">
          {canConnect ? VOICE_NOT_IMPLEMENTED : VOICE_CONNECT_FORBIDDEN}
        </p>
      </div>
    </div>
  );
}
