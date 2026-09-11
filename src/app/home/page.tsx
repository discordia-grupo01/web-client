import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { getSession } from "@/features/auth/session";
import { ROUTES } from "@/lib/constants";

/**
 * Home de la app (protegida). Placeholder hasta que se sumen las pantallas
 * reales (chat, voz, perfil). El middleware ya bloquea el acceso sin cookie;
 * aca revalidamos la sesion completa (JWT no expirado) como defensa en profundidad.
 */
export default function HomePage() {
  const session = getSession();
  if (!session) {
    redirect(ROUTES.login);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <div>
        <p className="font-display text-content-subtle text-sm font-semibold tracking-wider uppercase">
          Sesion iniciada
        </p>
        <h1 className="font-display text-content mt-1 text-3xl font-bold">
          Hola, {session.user.name}
        </h1>
        <p className="text-content-muted mt-2 text-sm">{session.user.email}</p>
      </div>

      <p className="text-content-muted text-sm leading-relaxed">
        Esta es la home protegida. Las pantallas de chat, voz y perfil se montan
        sobre esta base.
      </p>

      <LogoutButton />
    </main>
  );
}
