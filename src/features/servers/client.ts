import type {
  CreateServerActionResult,
  JoinServerActionResult,
  ServerSummary,
} from "./types";

/**
 * Llamadas del navegador hacia el BFF (`/api/servers`, mismo origen).
 * Nunca pega directo al gateway: el JWT nunca sale del servidor de Next.
 */

type ListServersResult =
  { ok: true; servers: ServerSummary[] } | { ok: false; message: string };

export async function listServersRequest(): Promise<ListServersResult> {
  try {
    const response = await fetch("/api/servers");
    return (await response.json()) as ListServersResult;
  } catch {
    return {
      ok: false,
      message: "No pudimos cargar tus servidores. Intenta de nuevo.",
    };
  }
}

/** Acepta tanto un link completo (".../xY7z2Q") como el código pelado. */
export function normalizeInviteCode(raw: string): string {
  const match = raw.trim().match(/([A-Za-z0-9_-]{4,20})$/);
  return match ? match[1] : raw.trim();
}

export async function joinServerRequest(
  code: string,
): Promise<JoinServerActionResult> {
  try {
    const response = await fetch(
      `/api/invites/${encodeURIComponent(code)}/join`,
      {
        method: "POST",
      },
    );
    return (await response.json()) as JoinServerActionResult;
  } catch {
    return {
      ok: false,
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
    };
  }
}

/**
 * `formData` va tal cual (multipart/form-data): no se usa axios/JSON aca
 * porque el navegador tiene que armar el boundary del archivo el mismo.
 */
export async function createServerRequest(
  formData: FormData,
): Promise<CreateServerActionResult> {
  try {
    const response = await fetch("/api/servers", {
      method: "POST",
      body: formData,
    });
    return (await response.json()) as CreateServerActionResult;
  } catch {
    return {
      ok: false,
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
    };
  }
}
