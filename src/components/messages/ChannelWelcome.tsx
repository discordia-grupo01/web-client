import {
  channelWelcomeSubtitle,
  channelWelcomeTitle,
} from "@discordia/client-shared";

import { Hash } from "lucide-react";

export function ChannelWelcome({ channelName }: { channelName: string }) {
  return (
    <div className="mb-6 px-2">
      <div className="from-accent-gradient-start to-accent-gradient-end mb-3 flex size-14 items-center justify-center rounded-full bg-gradient-to-br">
        <Hash size={28} className="text-white" />
      </div>
      <h2 className="font-display text-content mb-1 text-xl font-bold break-words">
        {channelWelcomeTitle(channelName)}
      </h2>
      <p className="text-content-muted text-sm">
        {channelWelcomeSubtitle(channelName)}
      </p>
    </div>
  );
}
