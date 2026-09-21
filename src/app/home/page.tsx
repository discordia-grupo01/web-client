import { redirect } from "next/navigation";

import { HomeShell } from "@/components/home/home-shell";
import { getSession } from "@/services/auth/session";
import { listMyServers } from "@/services/servers/service";
import { ROUTES } from "@/lib/constants";

/**
 * Home de la app (protegida). El middleware ya bloquea el acceso sin cookie;
 * aca revalidamos la sesion completa (JWT no expirado) como defensa en
 * profundidad, y de paso pedimos los servidores del usuario para no arrancar
 * el home con un estado vacio si ya tiene alguno creado
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
