import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { checkBasicAuth, WWW_AUTHENTICATE_HEADER } from "./lib/admin/basic-auth";

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

  return intlMiddleware(request);
}

export const config = {
  // Alles außer API-Routen, Next-Interna und statischen Dateien (mit Punkt).
  // /admin bleibt im Matcher — die Funktion oben brancht VOR next-intl.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
