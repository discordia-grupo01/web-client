import { NextResponse } from "next/server";

import { getSession } from "@/services/auth/session";
import { getProfileImage, getPublicProfile } from "@/services/profile/service";

/**
 * BFF de la foto de perfil pública de otro usuario. Mismo criterio que
 * `/api/profile/avatar` (la propia): resolvemos `avatar_url` server-side en
 * vez de exponer la URL interna de identify-service al navegador.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = getSession();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  const profile = await getPublicProfile(session.token, params.id);
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
