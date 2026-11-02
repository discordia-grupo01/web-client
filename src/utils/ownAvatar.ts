import type { User } from "@discordia/client-shared";

import { withAvatarVersion } from "./userProfile";

export function ownAvatarSrc(profile: Pick<User, "avatar_url">): string | null {
  return profile.avatar_url
    ? withAvatarVersion("/api/profile/avatar", profile.avatar_url)
    : null;
}
