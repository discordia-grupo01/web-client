import {
  MEMBER_PAGE_LIMIT,
  type MemberPageQuery,
} from "@discordia/client-shared";

/**
 * Lee de la URL de un BFF de miembros lo que el navegador pidio (`q`,
 * `limit`, `offset`, `has_role`) para reenviarlo al back. Sin `limit` se
 * piden 100, el maximo del back.
 */
export function memberPageQueryFrom(url: string): MemberPageQuery {
  const params = new URL(url).searchParams;
  return {
    search: params.get("q") ?? undefined,
    limit: Number(params.get("limit")) || MEMBER_PAGE_LIMIT,
    offset: Number(params.get("offset")) || 0,
    hasRole: params.get("has_role") === "false" ? false : undefined,
  };
}
