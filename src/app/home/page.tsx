import { redirect } from "next/navigation";

import { HomeShell } from "@/components/home/HomeShell";
import { getSession } from "@/services/auth/session";
import { listMyServers } from "@/services/servers/service";
import { ROUTES } from "@/lib/constants";

/**
 * Home de la app (protegida). El middleware ya bloquea el acceso sin cookie.
 *
 * Usa `getSession()`, no `getValidSession()`: un Server Component no puede
 * reescribir cookies durante el render, y `getValidSession()` necesita hacer
 * eso cuando el access token esta vencido. Como consecuencia, si el token ya
 * vencio (pestaña reabierta despues de un rato sin uso), este pedido a
 * `listMyServers` sale con un token viejo, falla, y `initialServers` llega
 * vacio -- aunque la sesion siga viva. `HomeShell` corrige eso enseguida con
 * un fetch propio en el cliente que si pasa por `getValidSession()` (via
 * `/api/servers`), asi que no hace falta un hard refresh.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: { server?: string };
}) {
  const session = getSession();
  if (!session) {
    redirect(ROUTES.login);
  }

  const result = await listMyServers(session.token);
  const initialServers = result.ok ? result.data : [];

  return (
    <HomeShell
      initialServers={initialServers}
      initialSelectedServerId={searchParams.server ?? null}
    />
  );
}
