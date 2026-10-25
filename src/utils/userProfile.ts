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

/** URL de la foto del usuario, o `null` si no tiene (se muestra su inicial). */
export function avatarSrcOf(
  userId: string,
  profile: ProfileSummary | null | undefined,
): string | null {
  return profile?.avatar_url ? `/api/users/${userId}/avatar` : null;
}
