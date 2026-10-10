"use client";

import {
  buildInviteLink,
  daysUntil,
  type Invitation,
  INVITE_COPY_FAILED,
  inviteStatus,
  type InviteStatus,
  MAX_USES_LABEL,
  validateMaxUses,
} from "@discordia/client-shared";

import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Link2,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { NumberField } from "@/components/ui/NumberField";
import {
  createInviteRequest,
  listInvitationsRequest,
  revokeInviteRequest,
} from "@/services/invites/client";
import { cn } from "@/lib/cn";

interface InviteModalProps {
  serverId: string;
  serverName: string;
  onClose: () => void;
}

const STATUS_COPY: Record<InviteStatus, { label: string; className: string }> =
  {
    active: { label: "Activa", className: "bg-success/15 text-success" },
    revoked: { label: "Revocada", className: "bg-danger/15 text-danger" },
    expired: {
      label: "Vencida",
      className: "bg-surface-input text-content-subtle",
    },
    exhausted: {
      label: "Agotada",
      className: "bg-surface-input text-content-subtle",
    },
  };

function InvitationRow({
  invitation,
  onRevoked,
}: {
  invitation: Invitation;
  onRevoked: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const status = inviteStatus(invitation);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        buildInviteLink(invitation.code, window.location.origin),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage(INVITE_COPY_FAILED);
    }
  }

  async function handleRevoke() {
    setIsRevoking(true);
    setErrorMessage("");
    const result = await revokeInviteRequest(invitation.code);
    setIsRevoking(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    onRevoked(invitation.code);
  }

  return (
    <div className="border-line rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <span className="text-content min-w-0 flex-1 truncate font-mono text-sm">
          /invite/{invitation.code}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
            STATUS_COPY[status].className,
          )}
        >
          {STATUS_COPY[status].label}
        </span>
      </div>

      <div className="text-content-subtle mt-2 flex items-center gap-4 text-xs">
        {status === "active" && invitation.expires_at ? (
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            Vence en {daysUntil(invitation.expires_at)}{" "}
            {daysUntil(invitation.expires_at) === 1 ? "día" : "días"}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <Users size={12} />
          {invitation.uses} usos ·{" "}
          {invitation.max_uses === null ? "Sin límite" : invitation.max_uses}
        </span>
      </div>

      {errorMessage ? (
        <p className="text-danger mt-2 text-xs">{errorMessage}</p>
      ) : null}

      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="text-content-muted hover:text-content flex cursor-pointer items-center gap-1.5 text-xs font-semibold"
        >
          {copied ? (
            <>
              <Check size={13} className="text-success" />
              Copiado
            </>
          ) : (
            <>
              <Copy size={13} />
              Copiar enlace
            </>
          )}
        </button>
        {status === "active" ? (
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isRevoking}
            className="text-danger flex cursor-pointer items-center gap-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={13} />
            {isRevoking ? "Revocando..." : "Revocar"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Lista todas las invitaciones del server (GET /v1/servers/:id/invites) y
 * permite generar nuevas o revocar las activas. El back permite varias
 * invitaciones activas a la vez (no hay "la" invitacion actual), asi que
 * mostramos todo el historial en vez de fingir que hay una sola -- separado
 * en dos solapas (activas / inactivas) para no mezclar links que ya no
 * sirven con los que si.
 */
type InviteTab = "active" | "inactive";

export function InviteModal({
  serverId,
  serverName,
  onClose,
}: InviteModalProps) {
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [maxUsesInput, setMaxUsesInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<InviteTab>("active");

  useEffect(() => {
    let cancelled = false;
    listInvitationsRequest(serverId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        setInvitations([]);
        return;
      }
      setInvitations(result.invitations);
    });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  async function handleGenerate() {
    const trimmed = maxUsesInput.trim();
    const maxUsesError = validateMaxUses(trimmed);
    if (maxUsesError) {
      setErrorMessage(maxUsesError);
      return;
    }
    const parsed = trimmed ? Number(trimmed) : undefined;

    setIsGenerating(true);
    setErrorMessage("");
    const result = await createInviteRequest(serverId, parsed);
    setIsGenerating(false);

    if (!result.ok) {
      setErrorMessage(result.fieldErrors?.max_uses ?? result.message);
      return;
    }
    setInvitations((prev) => [result.invitation, ...(prev ?? [])]);
    setMaxUsesInput("");
  }

  function handleRevoked(code: string) {
    setInvitations(
      (prev) =>
        prev?.map((inv) =>
          inv.code === code
            ? { ...inv, revoked_at: new Date().toISOString() }
            : inv,
        ) ?? null,
    );
  }

  const activeInvitations =
    invitations?.filter((inv) => inviteStatus(inv) === "active") ?? [];
  const inactiveInvitations =
    invitations?.filter((inv) => inviteStatus(inv) !== "active") ?? [];
  const visibleInvitations =
    activeTab === "active" ? activeInvitations : inactiveInvitations;

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
          maxWidth: 460,
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
              <Link2 size={17} />
            </div>
            <div>
              <h2 className="font-display text-content text-lg font-bold">
                Invitar miembros
              </h2>
              <p className="text-content-subtle text-xs">{serverName}</p>
            </div>
          </div>
        </div>

        <div className="border-line border-t px-7 py-5">
          <label
            htmlFor="invite-max-uses"
            className="text-content-subtle mb-1.5 block text-xs font-bold tracking-wider uppercase"
          >
            Generar invitación (vence en 7 días)
          </label>
          <div className="flex items-center gap-2">
            <NumberField
              id="invite-max-uses"
              value={maxUsesInput}
              onValueChange={setMaxUsesInput}
              placeholder={MAX_USES_LABEL}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleGenerate}
              isLoading={isGenerating}
              className="w-auto shrink-0"
            >
              <Plus size={14} />
              Generar
            </Button>
          </div>
          {errorMessage ? (
            <div className="border-danger/30 bg-danger/10 text-danger mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-7 pb-7">
          <p className="text-content-subtle mb-2 text-xs font-bold tracking-wider uppercase">
            Invitaciones
          </p>

          <div className="bg-surface-input mb-3 flex items-center gap-1 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={cn(
                "flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "active"
                  ? "bg-accent text-white"
                  : "text-content-muted hover:text-content",
              )}
            >
              Activas ({activeInvitations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("inactive")}
              className={cn(
                "flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "inactive"
                  ? "bg-accent text-white"
                  : "text-content-muted hover:text-content",
              )}
            >
              Inactivas ({inactiveInvitations.length})
            </button>
          </div>

          {invitations === null ? (
            <div className="flex items-center justify-center py-8">
              <span className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2" />
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-content-muted py-4 text-center text-sm">
              Todavía no hay invitaciones. Generá una arriba.
            </p>
          ) : visibleInvitations.length === 0 ? (
            <p className="text-content-muted py-4 text-center text-sm">
              {activeTab === "active"
                ? "No tenés invitaciones activas en este momento."
                : "Todavía no hay invitaciones inactivas."}
            </p>
          ) : (
            <div className="space-y-2.5">
              {visibleInvitations.map((inv) => (
                <InvitationRow
                  key={inv.code}
                  invitation={inv}
                  onRevoked={handleRevoked}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
