import { type PublicUser } from "@discordia/client-shared";

/** El nombre real si el perfil ya se resolvio; mientras tanto, el id. */
export function displayNameOf(
  userId: string,
  profile: PublicUser | undefined,
): string {
  return profile?.name ?? userId;
}

export function avatarSrcOf(
  userId: string,
  profile: PublicUser | undefined,
): string | null {
  return profile?.avatar_url ? `/api/users/${userId}/avatar` : null;
}
