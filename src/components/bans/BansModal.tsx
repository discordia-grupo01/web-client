"use client";

import { BANS_SUBTITLE, BANS_TITLE } from "@discordia/client-shared";

import { ModalShell } from "@/components/ui/ModalShell";

import { BanModalHeader } from "./BanModalHeader";
import { type BanTarget } from "./BanMemberModal";
import { BansPanel } from "./BansPanel";

const TITLE_ID = "bans-modal-title";

interface BansModalProps {
  serverId: string;
  ownerId: string;
  currentUserId: string | null;
  /** Abre el perfil del miembro encima de este modal. */
  onOpenProfile: (userId: string) => void;
  /** Abre la confirmacion de baneo de ese miembro, sin pasar por su perfil. */
  onBanMember: (target: BanTarget) => void;
  onClose: () => void;
}

/**
 * Modal de moderacion del servidor: envuelve BansPanel con ModalShell.
 */
export function BansModal({
  serverId,
  ownerId,
  currentUserId,
  onOpenProfile,
  onBanMember,
  onClose,
}: BansModalProps) {
  return (
    <ModalShell onClose={onClose} maxWidth={680} labelledBy={TITLE_ID}>
      <BansPanel
        serverId={serverId}
        ownerId={ownerId}
        currentUserId={currentUserId}
        header={
          <BanModalHeader
            titleId={TITLE_ID}
            title={BANS_TITLE}
            subtitle={BANS_SUBTITLE}
          />
        }
        onOpenProfile={onOpenProfile}
        onBanMember={onBanMember}
      />
    </ModalShell>
  );
}
