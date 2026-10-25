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
 *   auch als Objekt- oder static-Methode) und jeder Export einer Datei mit "use server". Gelesen wird der ganze
 *   App-Baum (ohne node_modules und .next sowie dist und .vercel im App-Wurzelordner: dist wie tsconfig exclude,
 *   .vercel als Build-Ausgabe in .gitignore; public und coverage werden gelesen). Symlinks im Baum sind verboten
 *   (der Wächter liest sie nicht, Next folgt ihnen). In packages/core/src ist "use server" verboten.
 * - Die ERSTE Anweisung jedes Einstiegs ist genau
 *     if (!(await torOffen())) return …;   bzw.   if (!(await torOffen())) throw …;
 *   mit genau EINER Anweisung als Ausgang und festem Wert je Art (W ein reiner Wert: Literal oder Objekt/Array
 *   daraus): Seite/Layout `return;` | `return null` | `return undefined` (kein JSX; das Code-Feld liegt unter
 *   /zinken/tor), Route-Handler `return new Response(null, { status: 403, … })` (ohne Inhalt), Actions
 *   `throw new Error(W?)` | `throw W` | `return { ok: false, … }` — bevor sie etwas lesen oder schreiben.
 *   Response, Error und undefined bindet die Datei dafür nicht selbst.
 * - torOffen ist in der Datei nur durch den Import von hier gebunden (keine eigene Funktion, Variable, kein
 *   Parameter und keine Destrukturierung gleichen Namens).
 * - Exporte werden auf eine Funktion derselben Datei zurückgeführt (Namen nur über const); Wrapper, Re-Exporte,
 *   export *, let/var und jede andere Exportform (außer reinen Typen) sind nicht prüfbar und deshalb nicht
 *   erlaubt. Daneben in Werkbank-Dateien nur Config-Exporte als reiner Wert (metadata nur mit robots noindex,
 *   als String mit dem Token noindex oder als Objekt mit index: false; viewport, dynamic, dynamicParams, revalidate,
 *   fetchCache, runtime, preferredRegion, maxDuration).
 * - Next-Konventionsdateien, die kein Einstieg sind (loading, error, global-error, not-found, global-not-found,
 *   forbidden, unauthorized, opengraph-image, twitter-image, icon, apple-icon, auch mit Ziffer, sowie sitemap,
 *   robots, manifest), gibt es unter der Werkbank nicht (Stand Next 15.5).
 */
export async function torOffen(): Promise<boolean> {
  const jar = await cookies();
  return pruefeCookie(jar.get(TOR_COOKIE)?.value, torKonfig(process.env), Date.now());
}
