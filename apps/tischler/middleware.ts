import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { checkBasicAuth, WWW_AUTHENTICATE_HEADER } from "./lib/admin/basic-auth";
import { pruefeCookie, torKonfig, TOR_COOKIE } from "./lib/zinken/werkbank/tor";

const intlMiddleware = createMiddleware(routing);

/**
 * /de|en/zinken/werkbank und alles darunter liegt hinter dem Probelauf-Tor, auch die Transportformen
 * (werkbank.rsc, werkbank.segments/…). Groß/Klein egal: zu viel Treffer zeigt nur das Code-Feld.
 */
const WERKBANK = /^\/(de|en)\/zinken\/werkbank(?:[/.]|$)/i;
/** Präfix für kaputte Kodierung: darunter fail-closed aufs Tor. */
const ZINKEN = /^\/(de|en)\/zinken\//i;

function sprache(gruppe: string | undefined): "de" | "en" {
  return gruppe?.toLowerCase() === "en" ? "en" : "de";
}

/** Sprache des Werkbank-Pfads oder null. Geprüft wird der dekodierte Pfad ohne doppelte Schrägstriche. */
function werkbankSprache(pathname: string): "de" | "en" | null {
  let pfad: string;
  try {
    pfad = decodeURIComponent(pathname);
  } catch {
    // kaputte Kodierung: unter /de|en/zinken/ fail-closed aufs Tor (Sprache aus dem Rohpfad), sonst der Rohpfad
    const roh = ZINKEN.exec(pathname.replace(/\/{2,}/g, "/"));
    if (roh) return sprache(roh[1]);
    pfad = pathname;
  }
  const treffer = WERKBANK.exec(pfad.replace(/\/{2,}/g, "/"));
  if (!treffer) return null;
  return sprache(treffer[1]);
}

/**
 * /admin/* liegt AUSSERHALB von [locale] und wird NICHT von next-intl
 * localized — stattdessen HTTP Basic Auth (fail-closed: ohne gesetzte
 * CRAFT_ADMIN_-Env immer 401). Alles andere laeuft wie bisher durch
 * das next-intl-Locale-Routing.
 *
 * Probelauf-Tor (Zeichnung b v9): /[locale]/zinken/werkbank nur mit gültigem
 * Tor-Cookie (Signatur + Ablauf, keine DB). Sonst zeigt ein rewrite das
 * Code-Feld (/[locale]/zinken/tor), noindex + no-store. Kein Log.
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

  const sprache = werkbankSprache(pathname);
  if (sprache) {
    const offen = await pruefeCookie(request.cookies.get(TOR_COOKIE)?.value, torKonfig(process.env), Date.now());
    if (!offen) {
      // frische URL statt nextUrl.clone(): NextURL hängt sonst den Schrägstrich der Anfrage an das Ziel
      const antwort = NextResponse.rewrite(new URL(`/${sprache}/zinken/tor${request.nextUrl.search}`, request.url));
      antwort.headers.set("Cache-Control", "no-store");
      antwort.headers.set("X-Robots-Tag", "noindex, nofollow");
      return antwort;
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Alles außer API-Routen, Next-Interna und statischen Dateien (mit Punkt).
  // /admin bleibt im Matcher — die Funktion oben brancht VOR next-intl.
  // Die Werkbank-Zeilen holen auch die Formen mit Punkt (werkbank.rsc, werkbank/x.rsc) vor das Tor,
  // die die erste Zeile auslässt (Next hängt an jede Zeile die Transport-Endungen an).
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/(de|en)/zinken/werkbank",
    "/(de|en)/zinken/werkbank/:path*",
  ],
};
