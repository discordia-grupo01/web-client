import type { ServerSummary } from "@discordia/client-shared";

/**
 * El icono y el banner del servidor se sirven por el BFF
 * (`/api/servers/:id/icon`, `/api/servers/:id/banner`) porque el endpoint del
 * gateway exige un header Authorization que un `<img src="...">` no puede
 * mandar (ver `services/servers/service.ts`).
 *
 * Esas respuestas van con `Cache-Control: private, max-age=300`, asi que hay
 * que arrastrar el `?v=` que el backend ya pone en `icon_url`/`banner_url`
 * (un hash del contenido, ver `iconstore.withVersion`): sin el, despues de
 * guardar una imagen nueva el navegador seguiria mostrando la vieja hasta
 * cinco minutos.
 */
function versionQuery(imageUrl: string | null): string {
  if (!imageUrl) return "";
  const version = imageUrl.split("?v=")[1];
  return version ? `?v=${encodeURIComponent(version)}` : "";
}

type ServerImages = Pick<ServerSummary, "id" | "icon_url" | "banner_url">;

/**
 * `null` cuando el servidor no tiene icono: asi `ServerAvatar` dibuja el
 * degradado con la inicial en vez de pedir una imagen que da 404 (el
 * navegador mostraria el icono de "imagen rota").
 */
export function serverIconSrc(server: ServerImages): string | null {
  if (!server.icon_url) return null;
  return `/api/servers/${server.id}/icon${versionQuery(server.icon_url)}`;
}

/** `null` cuando el servidor no tiene banner: no hay nada que pedirle al BFF. */
export function serverBannerSrc(server: ServerImages): string | null {
  if (!server.banner_url) return null;
  return `/api/servers/${server.id}/banner${versionQuery(server.banner_url)}`;
}
