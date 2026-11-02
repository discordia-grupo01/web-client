import {
  type MemberProfile,
  UNKNOWN_USER_NAME,
} from "@discordia/client-shared";

/** Lo minimo que las listas necesitan de un usuario: nombre y si tiene foto. */
export type ProfileSummary = Pick<MemberProfile, "name" | "avatar_url">;

/**
 * El nombre del perfil, o "Usuario desconocido" si el back todavia no lo
 * replico (`profile: null`).
 */
export function displayNameOf(profile: ProfileSummary | null | undefined) {
  return profile?.name ?? UNKNOWN_USER_NAME;
}

export function withAvatarVersion(path: string, avatarUrl: string): string {
  return `${path}?v=${hashString(avatarUrl)}`;
}

function hashString(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** URL de la foto del usuario, o `null` si no tiene (se muestra su inicial). */
export function avatarSrcOf(
  userId: string,
  profile: ProfileSummary | null | undefined,
): string | null {
  return profile?.avatar_url
    ? withAvatarVersion(`/api/users/${userId}/avatar`, profile.avatar_url)
    : null;
}
