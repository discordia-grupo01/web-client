# Baneos (moderación)

Modales para banear miembros y revocar baneos de un servidor.

- `BansModal`: dos pestañas, "Baneados (N)" y "Banear miembro". Búsqueda por
  nombre y paginación (20 por página) en ambas.
- `BanMemberModal`: confirmación de baneo con motivo opcional (máx. 512).
- Entradas: "Gestionar baneos" en el menú del servidor (solo con permiso
  `BAN_MEMBERS`, el propietario lo tiene implícito), el ícono de martillo en
  el perfil de un miembro y el botón "Banear" de cada fila de la pestaña
  "Banear miembro".

## Cómo se cargan los datos (y por qué)

Hay dos paginaciones encadenadas, que no hay que confundir:

| | Dónde | Tamaño | Para qué |
|---|---|---|---|
| Backend | `BAN_PAGE_LIMIT` (client-shared) | 100 por pedido (el máximo que acepta) | Traer todos los baneados en pocos requests |
| Pantalla | `DEFAULT_PAGE_SIZE` (client-shared) | 20 por página | Lo que ve el usuario (`usePagination`) |

1. `GET /v1/servers/:id/bans` devuelve **solo** `user_id`, `reason`,
   `banned_by` y `banned_at`. No trae nombre ni foto, y no filtra por texto.
2. Como se pide buscar por nombre, el front necesita todos los baneados. El
   BFF (`services/bans/service.ts`, `listBans`) recorre las páginas del
   backend de a 100 (`limit`/`offset`) hasta juntar el `total`. Con 437
   baneados son 5 requests, una sola vez al abrir el modal.
3. Los nombres se resuelven con `GET /api/users/:id`, un request por usuario
   (no hay endpoint batch), de a 6 en paralelo (`useUserProfiles`). Con 437
   baneados son 437 requests en segundo plano.
4. Buscar y cambiar de página se hace en memoria: no hay requests. Mientras
   un nombre no llegó se muestra el id, y la búsqueda solo ve los nombres ya
   cargados.

## Limitaciones conocidas

- **La paginación del backend no se aprovecha.** El front trae todo porque
  el backend no busca por nombre. Con decenas o pocos cientos de baneados
  anda bien; con miles, abrir el modal cuesta miles de requests de perfil.
- **No se evalúa la jerarquía de roles en el front.** `Role` no trae
  posición, así que "Banear" aparece con el permiso y es el backend el que
  rechaza (403 `target_outranks_actor`) si el objetivo tiene un rol igual o
  superior. El mensaje se muestra en `BanMemberModal`.
- **Al revocar desde "Gestionar baneos"** el baneo sale de la lista local, sin
  volver a pedir nada.

## Mejoras posibles

1. **Backend (la mejor):** que `GET /bans` y `GET /members` devuelvan nombre y
   `avatar_url` con un `JOIN` a `user_profiles` (la base de `servers` ya la
   tiene, sincronizada por eventos) y que `GET /bans` acepte un filtro por
   nombre. Con eso se eliminan los N requests de perfil y el front usa la
   paginación del backend de verdad: 20 por pedido, sin traer todo.
2. **Solo front, sin tocar el backend:** sin texto de búsqueda, usar la
   paginación del backend (`limit=20&offset=(página-1)*20`, con su `total`) y
   pedir solo los 20 perfiles visibles. Traer todo únicamente cuando hay
   texto de búsqueda. Detalles a cuidar: volver a pedir la página actual
   después de revocar (el `offset` se desfasa), retroceder de página si queda
   vacía, y lo mismo para la lista de miembros (`MEMBER_PAGE_LIMIT`).

## Lógica compartida con app-mobile

En `@discordia/client-shared`: tipos (`Ban`), `validateBanReason`,
paginación en memoria (`format/pagination`), búsqueda sin tildes
(`format/search`), mensajes y textos (`BAN_REASONS`, `BANS_*`). En
`web-client` queda solo el pegamento con React.
