import type { User } from "@discordia/client-shared";

export function ownAvatarSrc(profile: User): string | null {
  return profile.avatar_url ? "/api/profile/avatar" : null;
}
