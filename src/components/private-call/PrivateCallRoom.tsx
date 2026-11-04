"use client";

import {
  type MessageAuthor,
  pinOnScreenShareChange,
  type PrivateCallPartner,
  screenSharingIds,
  type VoiceParticipant,
} from "@discordia/client-shared";

import { useMemo, useState } from "react";

import { useElementSize } from "@/components/voice/hooks/useElementSize";
import { VoiceParticipantGrid } from "@/components/voice/VoiceParticipantGrid";
import { VoiceParticipantTile } from "@/components/voice/VoiceParticipantTile";
import { useVoiceSession } from "@/contexts/VoiceSessionContext";

const PIP_SHARE = 0.24;
const PIP_MIN_WIDTH = 128;
const PIP_MAX_WIDTH = 240;
const PIP_ASPECT = 16 / 9;
const NO_PANEL = () => undefined;

interface PrivateCallRoomProps {
  me: MessageAuthor;
  partner: PrivateCallPartner;
  local: VoiceParticipant;
  remote: VoiceParticipant;
}

export function PrivateCallRoom({
  me,
  partner,
  local,
  remote,
}: PrivateCallRoomProps) {
  const voice = useVoiceSession();
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const [isSelfMain, setIsSelfMain] = useState(false);
  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);
  const [lastSharingIds, setLastSharingIds] = useState<readonly string[]>([]);

  const participants = useMemo(() => [local, remote], [local, remote]);
  const sharingIds = screenSharingIds(participants);
  if (sharingIds.join("|") !== lastSharingIds.join("|")) {
    setLastSharingIds(sharingIds);
    setPinnedIdentity((pinned) =>
      pinOnScreenShareChange(pinned, lastSharingIds, participants),
    );
  }

  if (sharingIds.length > 0) {
    return (
      <VoiceParticipantGrid
        participants={participants}
        isConnecting={false}
        ownAvatarSrc={me.avatarUrl}
        avatarSrcOf={() => partner.avatarUrl}
        videoOf={voice.videoOf}
        onToggleMutedForMe={voice.toggleMutedForMe}
        onShowParticipants={NO_PANEL}
        pinnedIdentity={pinnedIdentity}
        onPinChange={setPinnedIdentity}
      />
    );
  }

  const main = isSelfMain ? local : remote;
  const corner = isSelfMain ? remote : local;
  const avatarOf = (participant: VoiceParticipant) =>
    participant.isLocal ? me.avatarUrl : partner.avatarUrl;
  const muteForMeOf = (participant: VoiceParticipant) =>
    participant.isLocal
      ? undefined
      : () => voice.toggleMutedForMe(participant.identity);

  const pipWidth = Math.round(
    Math.min(PIP_MAX_WIDTH, Math.max(PIP_MIN_WIDTH, size.width * PIP_SHARE)),
  );
  const pipHeight = Math.round(pipWidth / PIP_ASPECT);
  const hasRoom = size.width > 0 && size.height > 0;

  return (
    <div ref={containerRef} className="relative min-h-0 flex-1">
      {hasRoom ? (
        <>
          <div className="absolute inset-0 flex">
            <VoiceParticipantTile
              participant={main}
              width={size.width}
              height={size.height}
              avatarSrc={avatarOf(main)}
              video={voice.videoOf(main.identity)}
              onToggleMutedForMe={muteForMeOf(main)}
            />
          </div>
          <div
            className="absolute right-3 bottom-3 shadow-xl"
            style={{ width: pipWidth, height: pipHeight }}
          >
            <VoiceParticipantTile
              participant={corner}
              width={pipWidth}
              height={pipHeight}
              avatarSrc={avatarOf(corner)}
              video={voice.videoOf(corner.identity)}
              canExpand={false}
              onPress={() => setIsSelfMain((value) => !value)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
