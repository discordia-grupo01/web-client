import type { MessageAuthor, User } from "@discordia/client-shared";

/**
 * El usuario logueado como autor de sus mensajes.
 *
 * TODO: sin etiqueta ni color de rol por ahora. Cuando el back devuelva los
 * mensajes con su autor, los roles se resuelven igual para todos los miembros.
 */
export function authorFromProfile(user: User): MessageAuthor {
  return {
    id: String(user.id),
    name: user.name,
    avatarUrl: user.avatar_url ? "/api/profile/avatar" : null,
    roleName: null,
    roleColor: null,
  };
}
