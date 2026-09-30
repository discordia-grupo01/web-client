import { type MemberProfile } from "@discordia/client-shared";

/** Lo minimo que las listas necesitan de un usuario: nombre y si tiene foto. */
export type ProfileSummary = Pick<MemberProfile, "name" | "avatar_url">;

interface ProfiledUser {
  user_id: string;
  /** `null` mientras el back no replico el perfil de este usuario. */
  profile?: MemberProfile | null;
}

/**
 * Indexa por `user_id` el `profile` que el back adjunta a cada miembro o
 * baneado. Los que vienen con `profile: null` no figuran: las pantallas los
 * muestran como `UNKNOWN_USER_NAME`, sin pedir el perfil aparte.
 */
export function profilesByUserId(
  users: readonly ProfiledUser[],
): Record<string, MemberProfile> {
  const profiles: Record<string, MemberProfile> = {};
  for (const user of users) {
    if (user.profile) profiles[user.user_id] = user.profile;
  }
  return profiles;
}
