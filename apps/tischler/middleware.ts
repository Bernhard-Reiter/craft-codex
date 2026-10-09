import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { checkBasicAuth, WWW_AUTHENTICATE_HEADER } from "./lib/admin/basic-auth";
import { ZUGANG_COOKIE, pruefeZugang, zugangErlaubt } from "./lib/demo/zugang";

const intlMiddleware = createMiddleware(routing);

/**
 * /admin/* liegt AUSSERHALB von [locale] und wird NICHT von next-intl
 * localized — stattdessen HTTP Basic Auth (fail-closed: ohne gesetzte
 * CRAFT_ADMIN_-Env immer 401). Alles andere laeuft wie bisher durch
 * das next-intl-Locale-Routing.
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const authorized = await checkBasicAuth(
      request.headers.get("authorization"),
      process.env.CRAFT_ADMIN_USER,
      process.env.CRAFT_ADMIN_PASS,
    );
    if (!authorized) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": WWW_AUTHENTICATE_HEADER },
      });
    }
    return NextResponse.next();
  }

  // Demo-Zugang (Lienz): nur aktiv, wenn DEMO_PIN gesetzt ist — ohne PIN
  // bleibt die App wie bisher offen (die bezahlten Live-Sprach-Routen sind
  // davon unabhaengig fail-closed, siehe app/api/voice/realtime/_lib/guard.ts).
  if (process.env.DEMO_PIN) {
    const seg = pathname.split("/")[1];
    const locale = seg === "en" ? "en" : "de";
    const istZugangsSeite = /^\/(de|en)\/zugang\/?$/.test(pathname);
    if (!istZugangsSeite) {
      const status = await pruefeZugang(request.cookies.get(ZUGANG_COOKIE)?.value);
      if (!zugangErlaubt(status)) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/zugang`;
        url.search = `?ziel=${encodeURIComponent(pathname + request.nextUrl.search)}`;
        return NextResponse.redirect(url);
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Alles außer API-Routen, Next-Interna und statischen Dateien (mit Punkt).
  // /admin bleibt im Matcher — die Funktion oben brancht VOR next-intl.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
