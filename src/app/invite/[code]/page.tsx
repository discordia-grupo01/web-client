import { reasonOf } from "@discordia/client-shared";
import { AlertCircle, ShieldOff } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/services/auth/session";
import { joinServerByCode } from "@/services/invites/service";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Unirte a un servidor",
};

const REASON_COPY: Record<string, { title: string; body: string }> = {
  invitation_invalid: {
    title: "Este enlace ya no es válido",
    body: "Puede haber expirado, haber sido revocado, o llegar a su límite de usos. Pedile a alguien del servidor que te comparta uno nuevo.",
  },
  user_banned: {
    title: "No podés unirte a este servidor",
    body: "Fuiste baneado de este servidor.",
  },
};

/**
 * Landing de un link de invitacion (`/invite/:code`). Protegida por
 * middleware (redirige a `/login?next=/invite/:code` sin sesion). Si el
 * join sale bien -- seas nuevo miembro o ya lo fueras -- redirige directo al
 * servidor; si el codigo ya no sirve, explica por que en vez de rebotar a un
 * 404 generico.
 */
export default async function InvitePage({
  params,
}: {
  params: { code: string };
}) {
  const session = getSession();
  if (!session) {
    redirect(`${ROUTES.login}?next=${ROUTES.invite}/${params.code}`);
  }

  const result = await joinServerByCode(session.token, params.code);

  if (result.ok) {
    redirect(`${ROUTES.home}?server=${result.data.server_id}`);
  }

  const reason = reasonOf(result.details);
  const copy = (reason ? REASON_COPY[reason] : undefined) ?? {
    title: "No pudimos procesar la invitación",
    body: "Intenta de nuevo en un momento.",
  };
  const Icon = reason === "user_banned" ? ShieldOff : AlertCircle;

  return (
    <div
      className="flex min-h-dvh items-center justify-center p-4"
      style={{ background: "var(--bg-chat)" }}
    >
      <div
        className="border-line-strong flex w-full flex-col items-center gap-5 rounded-[20px] border px-7 py-9 text-center shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{ maxWidth: 420, background: "var(--bg-modal)" }}
      >
        <div className="bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl">
          <Icon size={30} />
        </div>
        <div>
          <h1 className="font-display text-content mb-2 text-xl font-bold">
            {copy.title}
          </h1>
          <p className="text-content-muted text-sm leading-relaxed">
            {copy.body}
          </p>
        </div>
        <Link
          href={ROUTES.home}
          className="bg-surface-input border-line text-content-muted w-full rounded-xl border py-3 text-sm font-semibold transition-all hover:brightness-110"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
