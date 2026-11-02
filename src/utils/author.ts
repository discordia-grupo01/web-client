import { authorFromUser, type User } from "@discordia/client-shared";

import { ownAvatarSrc } from "./ownAvatar";

/** El usuario logueado como autor de sus mensajes; su foto pasa por el BFF. */
export function authorFromProfile(user: User) {
  return authorFromUser(user, ownAvatarSrc(user));
}
