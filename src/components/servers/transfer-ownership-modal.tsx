"use client";

import {
  type Member,
  type OwnershipTransfer,
  type PublicUser,
  TRANSFER_CHOOSE_NEW_OWNER,
  TRANSFER_NONE_PENDING,
  TRANSFER_NO_OTHER_MEMBERS,
  TRANSFER_PENDING_OTHER_VIEWER,
} from "@discordia/client-shared";

import { AlertCircle, ArrowLeftRight, Check, Crown, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ServerAvatar } from "@/components/ui/server-avatar";
import { getPublicProfileRequest } from "@/services/profile/client";
import { listMembersRequest } from "@/services/members/client";
import {
  acceptTransferRequest,
  cancelTransferRequest,
  initiateTransferRequest,
  rejectTransferRequest,
} from "@/services/ownership-transfers/client";

interface TransferOwnershipModalProps {
  serverId: string;
  serverName: string;
  isOwner: boolean;
  currentUserId: string | null;
  pendingTransfer: OwnershipTransfer | null;
  isLoadingPendingTransfer: boolean;
  onPendingTransferChange: (transfer: OwnershipTransfer | null) => void;
  onClose: () => void;
  /** Se dispara solo cuando YO acepto: paso a ser el nuevo owner del server. */
  onOwnershipAccepted: () => void;
}

function ModalShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth: 440,
          maxHeight: "90dvh",
          background: "var(--bg-modal)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="bg-surface-input text-content-subtle border-line absolute top-4 right-4 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-110"
        >
          <X size={13} />
        </button>

        <div className="px-7 pt-8 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-info/15 text-info flex size-9 shrink-0 items-center justify-center rounded-xl">
              <ArrowLeftRight size={17} />
            </div>
            <h2 className="font-display text-content text-lg font-bold">
              Transferir propiedad
            </h2>
          </div>
        </div>

        <div className="border-line flex-1 overflow-y-auto border-t px-7 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function MemberOption({
  member,
  profile,
  selected,
  onSelect,
}: {
  member: Member;
  profile?: PublicUser;
  selected: boolean;
  onSelect: () => void;
}) {
  const displayName = profile?.name ?? member.user_id;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        selected
          ? "bg-accent/15 border-accent-strong flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors"
          : "border-line hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors"
      }
    >
      <ServerAvatar
        name={displayName}
        src={profile?.avatar_url ? `/api/users/${member.user_id}/avatar` : null}
        size={26}
        className="rounded-full"
      />
      <span className="text-content min-w-0 flex-1 truncate text-sm">
        {displayName}
      </span>
      {selected ? <Check size={15} className="text-accent shrink-0" /> : null}
    </button>
  );
}

/**
 * Cubre las 3 CA de "Transferir propiedad del servidor":
 *  - CA1/CA2 (iniciar): el owner elige un miembro de la lista real de
 *    `servers` -- si no es miembro, ni siquiera aparece en la lista, y el
 *    back igual lo valida por si la lista quedó desactualizada.
 *  - CA1/CA3 (responder): el destinatario ve la oferta y puede aceptar
 *    (pasa a ser el owner) o rechazar (nada cambia).
 * El owner que inició también puede cancelarla antes de que el destinatario
 * responda. `pendingTransfer` viene ya resuelto desde `ServerSidebarHeader`
 * (un solo fetch compartido entre el ítem de menú y este modal).
 */
export function TransferOwnershipModal({
  serverId,
  serverName,
  isOwner,
  currentUserId,
  pendingTransfer,
  isLoadingPendingTransfer,
  onPendingTransferChange,
  onClose,
  onOwnershipAccepted,
}: TransferOwnershipModalProps) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, PublicUser>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [counterpartProfile, setCounterpartProfile] =
    useState<PublicUser | null>(null);

  const canInitiate = isOwner && pendingTransfer === null;
  const isIncoming =
    pendingTransfer !== null &&
    currentUserId !== null &&
    pendingTransfer.to_user_id === currentUserId;
  const isOutgoing =
    pendingTransfer !== null &&
    currentUserId !== null &&
    pendingTransfer.from_user_id === currentUserId;
  /** El otro lado de la transferencia: a quien se la ofrecí, o quien me la ofreció. */
  const counterpartUserId = isOutgoing
    ? pendingTransfer?.to_user_id
    : isIncoming
      ? pendingTransfer?.from_user_id
      : undefined;

  useEffect(() => {
    if (!canInitiate) return;
    let cancelled = false;
    listMembersRequest(serverId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        setMembers([]);
        return;
      }
      const candidates = result.members.filter((member) => !member.is_owner);
      setMembers(candidates);
      for (const member of candidates) {
        getPublicProfileRequest(member.user_id).then((profile) => {
          if (cancelled || !profile.ok) return;
          setProfiles((prev) => ({ ...prev, [member.user_id]: profile.user }));
        });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, canInitiate]);

  /** Nombre de la otra persona involucrada, para no mostrar "otro miembro" a secas. */
  useEffect(() => {
    setCounterpartProfile(null);
    if (!counterpartUserId) return;
    let cancelled = false;
    getPublicProfileRequest(counterpartUserId).then((profile) => {
      if (cancelled || !profile.ok) return;
      setCounterpartProfile(profile.user);
    });
    return () => {
      cancelled = true;
    };
  }, [counterpartUserId]);

  async function handleInitiate() {
    if (!selectedUserId) return;
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await initiateTransferRequest(serverId, selectedUserId);
    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.fieldErrors?.to_user_id ?? result.message);
      return;
    }
    onPendingTransferChange(result.transfer);
  }

  async function handleCancel() {
    if (!pendingTransfer) return;
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await cancelTransferRequest(serverId, pendingTransfer.id);
    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    onPendingTransferChange(null);
  }

  async function handleAccept() {
    if (!pendingTransfer) return;
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await acceptTransferRequest(serverId, pendingTransfer.id);
    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    onPendingTransferChange(null);
    onOwnershipAccepted();
  }

  async function handleReject() {
    if (!pendingTransfer) return;
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await rejectTransferRequest(serverId, pendingTransfer.id);
    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    onPendingTransferChange(null);
    onClose();
  }

  const errorBanner = errorMessage ? (
    <div className="border-danger/30 bg-danger/10 text-danger mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{errorMessage}</span>
    </div>
  ) : null;

  if (isLoadingPendingTransfer) {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex items-center justify-center py-8">
          <span className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2" />
        </div>
      </ModalShell>
    );
  }

  if (pendingTransfer && isIncoming) {
    return (
      <ModalShell onClose={onClose}>
        {errorBanner}
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="bg-highlight/15 text-highlight flex size-14 items-center justify-center rounded-2xl">
            <Crown size={26} />
          </div>
          <p className="text-content-muted text-sm leading-relaxed">
            <strong className="text-content">
              {counterpartProfile?.name ?? pendingTransfer.from_user_id}
            </strong>{" "}
            quiere transferirte la propiedad de{" "}
            <strong className="text-content">{serverName}</strong>. Si aceptás,
            pasás a ser el nuevo propietario.
          </p>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={isSubmitting}
              className="bg-surface-input border-line text-content-muted flex-1 cursor-pointer rounded-xl border py-3 text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Rechazar
            </button>
            <Button
              type="button"
              onClick={handleAccept}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </ModalShell>
    );
  }

  if (pendingTransfer && isOutgoing) {
    return (
      <ModalShell onClose={onClose}>
        {errorBanner}
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="bg-info/15 text-info flex size-14 items-center justify-center rounded-2xl">
            <ArrowLeftRight size={26} />
          </div>
          <p className="text-content-muted text-sm leading-relaxed">
            Le ofreciste la propiedad de{" "}
            <strong className="text-content">{serverName}</strong> a{" "}
            <strong className="text-content">
              {counterpartProfile?.name ?? pendingTransfer.to_user_id}
            </strong>
            . Todavía no respondió: podés cancelar la transferencia mientras
            esté pendiente.
          </p>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-danger flex cursor-pointer items-center gap-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Cancelando..." : "Cancelar transferencia"}
          </button>
        </div>
      </ModalShell>
    );
  }

  if (pendingTransfer) {
    // Otro miembro (ni el owner ni el destinatario) mirando el estado.
    return (
      <ModalShell onClose={onClose}>
        <p className="text-content-muted py-4 text-center text-sm">
          {TRANSFER_PENDING_OTHER_VIEWER}
        </p>
      </ModalShell>
    );
  }

  if (!isOwner) {
    return (
      <ModalShell onClose={onClose}>
        <p className="text-content-muted py-4 text-center text-sm">
          {TRANSFER_NONE_PENDING}
        </p>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      {errorBanner}
      <p className="text-content-subtle mb-3 text-xs font-bold tracking-wider uppercase">
        {TRANSFER_CHOOSE_NEW_OWNER}
      </p>

      {members === null ? (
        <div className="flex items-center justify-center py-8">
          <span className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-content-muted py-4 text-center text-sm">
          {TRANSFER_NO_OTHER_MEMBERS}
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <MemberOption
              key={member.user_id}
              member={member}
              profile={profiles[member.user_id]}
              selected={selectedUserId === member.user_id}
              onSelect={() => setSelectedUserId(member.user_id)}
            />
          ))}
        </div>
      )}

      {members && members.length > 0 ? (
        <Button
          type="button"
          onClick={handleInitiate}
          isLoading={isSubmitting}
          disabled={isSubmitting || !selectedUserId}
          className="mt-5"
        >
          <ArrowLeftRight size={14} />
          Transferir propiedad
        </Button>
      ) : null}
    </ModalShell>
  );
}
