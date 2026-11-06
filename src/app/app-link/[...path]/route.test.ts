import { describe, expect, it } from "vitest";

import { buildAppLinkTargets, normalizeQuery } from "./appLink";
import { GET } from "./route";

const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const DESKTOP_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";

function get(pathAndQuery: string, userAgent: string) {
  const url = new URL(`https://discordia.test/app-link/${pathAndQuery}`);
  const path = url.pathname.replace("/app-link/", "").split("/");
  return GET(new Request(url, { headers: { "user-agent": userAgent } }), {
    params: { path },
  });
}

describe("normalizeQuery", () => {
  it("pasa a & el segundo ? que agrega Mercado Pago", () => {
    expect(normalizeQuery("?kind=premium?preapproval_id=PRE1")).toBe(
      "kind=premium&preapproval_id=PRE1",
    );
  });
});

describe("buildAppLinkTargets", () => {
  it("arma el link de la app, el intent de Android y la web", () => {
    const targets = buildAppLinkTargets(
      "billing/return",
      "?kind=points&purchase_id=p1",
      "https://discordia.test",
    );

    expect(targets.appUrl).toBe(
      "discordia://billing/return?kind=points&purchase_id=p1",
    );
    expect(targets.webUrl).toBe(
      "https://discordia.test/billing/return?kind=points&purchase_id=p1",
    );
    expect(targets.androidUrl).toBe(
      "intent://billing/return?kind=points&purchase_id=p1#Intent;scheme=discordia;" +
        "package=com.g1discordia.appmobile;" +
        `S.browser_fallback_url=${encodeURIComponent(targets.webUrl)};end`,
    );
  });
});

describe("GET /app-link/[...path]", () => {
  it("en Android abre la app con intent:// y deja la web de respaldo", async () => {
    const response = get("confirm-email?token=abc", ANDROID_UA);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(html).toContain(
      'window.location.replace("intent://confirm-email?token=abc#Intent;scheme=discordia;',
    );
    expect(html).toContain(
      'href="https://discordia.test/confirm-email?token=abc"',
    );
  });

  it("en iPhone abre discordia:// directo", async () => {
    const html = await get("billing/return?kind=premium", IPHONE_UA).text();

    expect(html).toContain(
      'window.location.replace("discordia://billing/return?kind=premium")',
    );
  });

  it("en una computadora va directo a la página web", () => {
    const response = get("confirm-email?token=abc", DESKTOP_UA);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://discordia.test/confirm-email?token=abc",
    );
  });

  it("no abre destinos fuera de la lista", () => {
    expect(get("home?x=1", ANDROID_UA).status).toBe(404);
    expect(get("billing/return/extra", ANDROID_UA).status).toBe(404);
  });

  it("no deja cerrar el script desde el query", async () => {
    const html = await get(
      "confirm-email?token=%3C/script%3E%3Cscript%3Ealert(1)",
      ANDROID_UA,
    ).text();

    expect(html).not.toContain("</script><script>");
  });
});
