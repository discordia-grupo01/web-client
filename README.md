# web-client

Cliente web de Discordia.

## Tabla de contenidos

- [Introducción](#introducción)
- [Pre-requisitos](#pre-requisitos)
- [Cómo correr](#cómo-correr)
- [Variables de entorno](#variables-de-entorno)
- [Comandos Docker](#comandos-docker)
- [Tests](#tests)
- [Más documentación](#más-documentación)

## Introducción

`web-client` es la aplicación web de Discordia: registro e inicio de sesión (con email, con Google y con segundo factor), servidores, canales de texto y de voz, mensajes directos, notificaciones, perfil y Premium. Cubre las historias de usuario final del catálogo para la web.

Está hecha con Next.js 14 (App Router), React 18 y TypeScript, con Tailwind CSS para los estilos y Vitest para los tests. La lógica que comparte con la app móvil (tipos, textos y funciones puras) vive en el paquete [`client-shared`](https://github.com/discordia-grupo01/client-shared); acá queda lo que es propio de la web: las pantallas, los hooks y el acceso a la API.

El navegador casi nunca le habla directo al backend. Las pantallas llaman a rutas del propio servidor de Next (un BFF), que reenvía el pedido al gateway con el JWT guardado en una cookie. Las únicas conexiones directas desde el navegador son los WebSockets (mensajes, notificaciones y presencia de voz) y la subida de adjuntos, y todas pasan por el gateway (Kong), nunca por un servicio suelto. La web en producción corre en Vercel.

## Pre-requisitos

- **Node.js 20** y **npm**, si querés correrla en tu máquina.
- **Docker** y **Docker Compose** v2.24 o más nuevo, si preferís correrla en un contenedor.
- **El backend**, para que la web tenga a quién hablarle. Lo más simple es levantarlo todo con el repositorio [`infrastructure`](https://github.com/discordia-grupo01/infrastructure). Sin backend, la web abre igual y muestra la pantalla de login.

## Cómo correr

### Con Docker Compose

Levanta la web en modo desarrollo dentro de un contenedor:

```bash
docker compose up
```

La primera vez tarda un poco, porque instala las dependencias. Cuando termine, abrí http://localhost:3000.

El contenedor busca el gateway en `host.docker.internal:8000`, que desde un contenedor es tu máquina. Si el gateway corre en otro lado, completá `API_URL_DOCKER` en el `.env`.

Este compose levanta solo la web. Para el sistema completo, usá el compose del repositorio `infrastructure`, que también la incluye.

### Para desarrollar

Si vas a tocar el código, te conviene correrla en tu máquina, con recarga en caliente:

```bash
cp .env.example .env
npm install
npm run dev
```

Con el `.env` de ejemplo, la web le habla al gateway en `http://localhost:8000`.

## Variables de entorno

Se leen del entorno o de un archivo `.env`. El archivo [`.env.example`](.env.example) trae los valores para correr en local. Las variables que empiezan con `NEXT_PUBLIC_` quedan incluidas en el código al compilar: no pongas secretos ahí.

| Variable                           | Default                       | Descripción                                                                                                                                                                     |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`              | `http://localhost:8000`       | URL del gateway (Kong), al que le habla el servidor de Next. Nunca apunta directo a un servicio.                                                                                |
| `NEXT_PUBLIC_WS_URL`               | sale de `NEXT_PUBLIC_API_URL` | URL del WebSocket de mensajes (`ws://host/socket`). Es una de las pocas cosas a las que se conecta el navegador directo.                                                        |
| `NEXT_PUBLIC_UPLOAD_URL`           | sale de `NEXT_PUBLIC_API_URL` | URL del gateway a la que el navegador sube los adjuntos, sin pasar por Next (Vercel corta los pedidos de más de 4,5 MB). Su origen tiene que estar en `WEB_ORIGIN` del gateway. |
| `NEXT_PUBLIC_VOICE_WS_URL`         | sale de `NEXT_PUBLIC_API_URL` | URL del WebSocket de presencia de voz. En producción usa `wss://`.                                                                                                              |
| `NEXT_PUBLIC_NOTIFICATIONS_WS_URL` | sale de `NEXT_PUBLIC_API_URL` | URL del WebSocket de notificaciones.                                                                                                                                            |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`     | vacío                         | Client ID de Google (tipo "Web application"). Tiene que coincidir con el `GOOGLE_CLIENT_ID` de `identify-service`. Vacío = sin login con Google.                                |

Variables que usa solo `docker-compose.yml`:

| Variable         | Default                            | Descripción                                                               |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `WEB_PORT`       | `3000`                             | Puerto de la web en tu máquina.                                           |
| `API_URL_DOCKER` | `http://host.docker.internal:8000` | URL del gateway para el servidor de Next que corre dentro del contenedor. |

## Comandos Docker

Todos desde la raíz del repositorio.

| Qué querés hacer                                | Comando                      |
| ----------------------------------------------- | ---------------------------- |
| Levantar la web                                 | `docker compose up`          |
| Levantar en segundo plano                       | `docker compose up -d`       |
| Ver los logs                                    | `docker compose logs -f web` |
| Ver qué está corriendo                          | `docker compose ps`          |
| Bajar todo                                      | `docker compose down`        |
| Bajar todo y borrar las dependencias instaladas | `docker compose down -v`     |

El repositorio también trae un `Dockerfile` que compila la web y la sirve con `npm start`. Como las variables `NEXT_PUBLIC_` se fijan al compilar, esa imagen apunta al gateway que haya en `.env` en el momento de construirla. La producción no la usa: se despliega en Vercel.

```bash
docker build -t web-client .
docker run --rm -p 3000:3000 web-client
```

## Tests

```bash
npm test
```

Corre los tests con Vitest y Testing Library. Para revisar el resto del código:

| Qué                | Comando                                                     |
| ------------------ | ----------------------------------------------------------- |
| Linter (ESLint)    | `npm run lint`                                              |
| Tipos (TypeScript) | `npm run typecheck`                                         |
| Formato            | `npm run format:check` (y `npm run format` para arreglarlo) |

El CI corre todo eso en cada pull request. El repositorio se formatea con Prettier; activá el hook una vez por clon:

```bash
git config core.hooksPath .githooks
```

## Más documentación

- [`client-shared`](https://github.com/discordia-grupo01/client-shared): los tipos, textos y funciones que comparten la web, la app móvil y el backoffice.
- [`infrastructure`](https://github.com/discordia-grupo01/infrastructure): cómo levantar todo el sistema para probar la web conectada de verdad.
