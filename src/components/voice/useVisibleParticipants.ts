import type { VoiceParticipant } from "@discordia/client-shared";

import { useState } from "react";

import { pickVisibleParticipants } from "@/lib/voiceGrid";

interface SpeakingMemory {
  key: string;
  tick: number;
  spokeAt: ReadonlyMap<string, number>;
}

/**
 * Quienes ocupan los `slots` lugares de la grilla cuando no entran todos.
 * Recuerda quien hablo hace poco y a quienes ya se veian, para que los tiles
 * no salten cada vez que alguien dice algo.
 */
export function useVisibleParticipants(
  participants: readonly VoiceParticipant[],
  slots: number,
): VoiceParticipant[] {
  const speakingKey = participants
    .filter((participant) => participant.speaking)
    .map((participant) => participant.identity)
    .join("|");
  const [memory, setMemory] = useState<SpeakingMemory>({
    key: "",
    tick: 0,
    spokeAt: new Map(),
  });
  if (memory.key !== speakingKey) {
    const tick = memory.tick + 1;
    const spokeAt = new Map(memory.spokeAt);
    speakingKey
      .split("|")
      .filter(Boolean)
      .forEach((identity) => spokeAt.set(identity, tick));
    setMemory({ key: speakingKey, tick, spokeAt });
  }

  const [previous, setPrevious] = useState<readonly string[]>([]);
  const visible = pickVisibleParticipants(
    participants,
    slots,
    previous,
    memory.spokeAt,
  );
  const visibleKey = visible.map((participant) => participant.identity);
  if (visibleKey.join("|") !== previous.join("|")) setPrevious(visibleKey);

  return visible;
}
