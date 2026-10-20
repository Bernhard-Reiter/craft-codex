import "server-only";
import { cookies } from "next/headers";
import { pruefeCookie, torKonfig, TOR_COOKIE } from "./tor";

/**
 * Probelauf-Tor auf der Server-Seite: dieselbe Prüfung wie in der Middleware (Signatur + Ablauf, keine DB),
 * an der Stelle, die Next aufruft (zusätzlich zur Middleware).
 *
 * Regel für die Werkbank (der Wächter in tor-waechter.test.ts setzt sie durch):
 * - Werkbank-Dateien: page | layout | template | default | route unter …/zinken/werkbank/… (auch in Gruppen,
 *   @slots und Intercept-Ordnern) sowie app/api/zinken/werkbank/**.
 * - Einstieg = Default-Export, jede exportierte HTTP-Methode, jede Funktion mit "use server" (auch inline,
 *   auch als Objekt- oder static-Methode) und jeder Export einer Datei mit "use server".
 * - Die ERSTE Anweisung jedes Einstiegs ist genau
 *     if (!(await torOffen())) return …;   bzw.   if (!(await torOffen())) throw …;
 *   Seite/Layout geben dann das Code-Feld zurück, Route-Handler 403 ohne Inhalt,
 *   Actions werfen oder geben { ok: false } zurück, bevor sie etwas lesen oder schreiben.
 * - Exporte werden auf eine Funktion derselben Datei zurückgeführt (Namen nur über const); Wrapper, Re-Exporte,
 *   export *, let/var und jede andere Exportform (außer reinen Typen) sind nicht prüfbar und deshalb nicht
 *   erlaubt. Daneben in Werkbank-Dateien nur Config-Literale (metadata mit robots noindex, viewport, dynamic,
 *   dynamicParams, revalidate, fetchCache, runtime, preferredRegion, maxDuration).
 * - Next-Sonderdateien (opengraph-image, twitter-image, icon, apple-icon, auch mit Ziffer, sowie sitemap, robots,
 *   manifest) gibt es unter der Werkbank nicht (Stand Next 15.5).
 */
export async function torOffen(): Promise<boolean> {
  const jar = await cookies();
  return pruefeCookie(jar.get(TOR_COOKIE)?.value, torKonfig(process.env), Date.now());
}
