/**
 * Parsea el header crudo `Set-Cookie` de una respuesta de axios (Node expone
 * `response.headers['set-cookie']` como array de strings, una por cookie).
 */
export function extractCookieValue(
  setCookieHeader: string[] | undefined,
  name: string,
): string | null {
  if (!setCookieHeader) return null;

  const prefix = `${name}=`;
  for (const entry of setCookieHeader) {
    const segment = entry.split(";")[0]?.trim();
    if (segment?.startsWith(prefix)) {
      return segment.slice(prefix.length);
    }
  }

  return null;
}
