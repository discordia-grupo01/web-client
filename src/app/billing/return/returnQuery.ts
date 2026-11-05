type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Aplana el query de la vuelta de Mercado Pago. La suscripción vuelve como
 * `?kind=premium?preapproval_id=…`: Mercado Pago agrega sus parámetros con un
 * segundo `?` aunque la URL ya tenga query, así que Next lee
 * `kind = "premium?preapproval_id=…"`. Lo que viene después del `?` se trata
 * como parámetros aparte, sin pisar los que ya estaban.
 */
export function flattenReturnQuery(
  searchParams: SearchParams,
): Record<string, string> {
  const flat: Record<string, string> = {};
  const extra: Record<string, string> = {};

  for (const [key, raw] of Object.entries(searchParams)) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined) continue;
    const [head, ...rest] = value.split("?");
    flat[key] = head;
    if (rest.length > 0) {
      new URLSearchParams(rest.join("&")).forEach((nested, nestedKey) => {
        extra[nestedKey] = nested;
      });
    }
  }
  return { ...extra, ...flat };
}
