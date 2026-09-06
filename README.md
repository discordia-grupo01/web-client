# discordia-web

Cliente web de Discordia (React + Next.js).

## Setup local

```bash
cp .env.example .env
npm install
npm run dev
```

## Variables de entorno

| Variable            | Default               | Descripcion                                     |
| ------------------- | --------------------- | ----------------------------------------------- |
| NEXT_PUBLIC_API_URL | http://localhost:3000 | URL base del Gateway al que le pega el cliente. |

`.env.example` solo trae la estructura (sin valores sensibles). Los valores reales van en tu propio `.env`, que nunca se sube (ya esta en `.gitignore`).

## Estructura de carpetas

```
front-template/
├── src/
│   ├── app/
│   │   └── page.tsx          rutas y paginas (App Router de Next.js)
│   ├── components/            componentes de UI reutilizables
│   ├── hooks/                 hooks de React reutilizables
│   └── lib/
│       ├── api-client.ts     cliente HTTP hacia el Gateway (maneja el token)
│       ├── constants.ts      constantes de la app (ej. APP_NAME)
│       └── env.ts             lectura centralizada de variables de entorno
├── public/                    assets estaticos
├── .github/
│   └── workflows/
│       └── ci.yml            lint, format:check, test y build en cada PR/push a main
├── .githooks/
│   └── pre-commit             hook de prettier local
├── next.config.mjs
├── tsconfig.json
├── Dockerfile                 build multi-stage para la imagen de produccion
└── .env.example                estructura de variables de entorno (sin valores sensibles)
```

Las carpetas `src/components/` y `src/hooks/` vienen vacias (`.gitkeep`) porque el codigo de negocio todavia no existe en el template.

## Comandos

- `npm run dev` - corre el servicio localmente.
- `npm run lint` - corre ESLint (`next/core-web-vitals`).
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
cambia el contenido de src/app y a que endpoints del Gateway le pega.
