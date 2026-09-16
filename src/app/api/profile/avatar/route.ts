import { NextResponse } from "next/server";

import { getSession } from "@/services/auth/session";
import { getOwnProfile, getProfileImage } from "@/services/profile/service";

/**
 * BFF de la foto de perfil propia. `avatar_url` es una ruta servida sin auth
 * por identify-service (`/uploads/profile-images/...`, no expuesta detras
 * del gateway por su propio dominio), pero igual la resolvemos server-side
 * para no tener que exponer la URL interna del backend al navegador -- mismo
 * criterio que `/api/servers/:id/icon`.
 */
export async function GET(): Promise<NextResponse> {
  const session = getSession();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  const profile = await getOwnProfile(session.token);
  if (!profile.ok || !profile.data.avatar_url) {
    return new NextResponse(null, { status: 404 });
  }

  const image = await getProfileImage(profile.data.avatar_url);
  if (!image.ok) {
    return new NextResponse(null, { status: image.status });
  }

  return new NextResponse(image.body, {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
