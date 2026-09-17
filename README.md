# discordia-web

Cliente web de Discordia (React + Next.js, App Router).

## Setup local

```bash
cp .env.example .env
npm install
npm run dev
```

Necesita el backend corriendo: `identify-service` en `http://localhost:8080` (ver su README).

## Variables de entorno

| Variable            | Default               | Descripcion                              |
| ------------------- | --------------------- | ---------------------------------------- |
| NEXT_PUBLIC_API_URL | http://localhost:8080 | URL base del backend (identify-service). |

`.env.example` solo trae la estructura (sin valores sensibles). Los valores reales van en tu propio `.env`, que nunca se sube (ya esta en `.gitignore`).

## Estructura de carpetas

```
discordia-web/
├── src/
│   ├── app/                     App Router: cada carpeta con page.tsx es una ruta
│   │   ├── layout.tsx           layout raiz (fuentes, providers, metadata)
│   │   ├── globals.css          Tailwind + design tokens del tema
│   │   ├── (grupo)/             route group: agrupa rutas que comparten layout
│   │   └── api/                 route handlers (endpoints HTTP; ver "Autenticacion")
│   ├── middleware.ts            guardia de rutas (corre antes de cada request)
│   ├── components/
│   │   ├── ui/                  piezas genericas reutilizables (Button, TextField, ...)
│   │   └── <feature>/           componentes propios de una feature de UI
│   ├── services/                codigo agrupado por dominio del backend (auth, servers, channels, ...)
│   │   └── <dominio>/           validacion, service (server), client (browser), hooks
│   ├── types/                   tipos por dominio: <dominio>.types.ts (Channel, Role, User, ...)
│   ├── hooks/                   hooks de React reutilizables entre features
│   └── lib/
│       ├── api-client.ts         cliente HTTP hacia el backend (server-only)
│       ├── browser-api-client.ts cliente HTTP compartido para navegador (BFF, `/api/*`)
│       ├── constants.ts          constantes de la app (APP_NAME, rutas, ...)
│       ├── env.ts                lectura centralizada de variables de entorno
│       └── cn.ts                 helper para componer clases de Tailwind
├── public/                      assets estaticos
├── .github/
│   └── workflows/
│       └── ci.yml               format:check, lint, test y build en cada PR/push a main
├── .githooks/
│   └── pre-commit               hook de prettier local
├── next.config.mjs
├── postcss.config.mjs           Tailwind v4 (plugin de PostCSS)
├── tsconfig.json
├── vitest.config.ts             config de tests (Vitest + Testing Library)
├── Dockerfile                   build multi-stage para la imagen de produccion
└── .env.example                 estructura de variables de entorno (sin valores sensibles)
```

Los tipos de cada dominio (`Channel`, `Role`, `User`, los `*ActionResult` de cada
endpoint, etc.) viven en `types/<dominio>.types.ts`, no dentro de
`services/<dominio>/`: así se pueden importar sin arrastrar `service.ts`/`client.ts`
(uno es server-only, el otro pega contra el BFF) y quedan todos los tipos del
proyecto en un solo lugar. Un tipo que un dominio necesita de otro (ej.
`ServerSummary` referenciando `Channel`) se importa entre archivos de `types/`
con ruta relativa (`./channel.types`), no cruzando a `services/`.

## Convenciones de Next (App Router)

- **Rutas por carpeta.** Un `page.tsx` dentro de `src/app/x/` crea la ruta `/x`. No hay router que configurar.
- **Route groups.** Una carpeta entre parentesis —`(auth)`— agrupa rutas para compartir un `layout.tsx` sin aparecer en la URL: `(auth)/login/page.tsx` responde a `/login`, no a `/auth/login`.
- **Route handlers.** Un `route.ts` es un endpoint HTTP. Se exporta una funcion por verbo (`GET`, `POST`, ...) y Next llama la que coincide con el metodo del request. La logica vive en `services/`; el `route.ts` es solo la cascara HTTP.
- **Server vs client.** Los componentes corren en el servidor por defecto: ahi se lee la cookie, se habla con el backend y se manejan secretos. Los que necesitan estado o eventos del navegador llevan `"use client"` en la primera linea.
- **`middleware.ts`.** Corre antes de cada request. Lo usamos para redirigir segun haya o no sesion.
- **Alias `@/`.** `@/x` apunta a `src/x` (configurado en `tsconfig.json`).

## Autenticacion

El navegador nunca habla directo con el backend. Pega contra los route handlers de
`/api/*` (mismo origen) y Next hace de intermediario (patron BFF): reenvia la llamada
y guarda la sesion en una cookie `httpOnly` que el JavaScript del navegador no puede leer.

```
navegador ──► /api/... (Next) ──► backend
                  │
                  └─ sesion en cookie httpOnly
```

- `middleware.ts` es el guardia: sin sesion, las rutas protegidas redirigen a `/login`;
  con sesion, `/login` redirige a la app.
- Las paginas server revalidan la sesion antes de renderizar (segunda barrera).
- Cada feature con llamadas autenticadas sigue el mismo camino: `route.ts` en
  `app/api/` + logica en `services/<dominio>/`.

El detalle fino del login (endpoints, forma del token, que falta del backend) esta en
los comentarios de `src/services/auth/`.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript estricto
- Tailwind CSS v4 (`@tailwindcss/postcss`, sin archivo de config)
- Formularios con `useState` + validacion en funciones propias (sin libreria)
- axios para HTTP, lucide-react para iconos
- Vitest + Testing Library para tests

## Comandos

- `npm run dev` - corre el servicio localmente.
- `npm run lint` - corre ESLint (`next/core-web-vitals`).
- `npm run typecheck` - chequea tipos con `tsc` (sin emitir).
- `npm run format` / `npm run format:check` - formatea o chequea el formato con Prettier.
- `npm run test` - corre los tests con Vitest.
- `npm run build` - compila para produccion.

## Formateo automatico

Este repo se autoformatea con Prettier en cada commit. Activalo una vez por clone:

```bash
git config core.hooksPath .githooks
```

Si usan VS Code con la extension oficial de Prettier, tambien formatea al guardar (ya configurado en .vscode/settings.json).

El CI corre `npm run format:check` como red de seguridad (falla si encuentra archivos sin formatear), por si alguien clono sin activar el hook.

## Notas

Para el backoffice, duplicar esta estructura en discordia-backoffice — mismo stack,
cambia el contenido de `src/app` y a que endpoints del backend le pega.
