import { authorFromUser, type User } from "@discordia/client-shared";

/** El usuario logueado como autor de sus mensajes; su foto pasa por el BFF. */
export function authorFromProfile(user: User) {
  return authorFromUser(user, user.avatar_url ? "/api/profile/avatar" : null);
}
