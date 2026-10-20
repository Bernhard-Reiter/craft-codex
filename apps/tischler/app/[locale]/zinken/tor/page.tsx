import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { torKonfig } from "../../../../lib/zinken/werkbank/tor";

/**
 * Code-Feld des Probelauf-Tors (Zeichnung b v9, Missbrauchsschutz; Schnitt S2b).
 * Die Middleware zeigt diese Seite per rewrite statt /[locale]/zinken/werkbank, solange kein
 * gültiges Tor-Cookie da ist. Das Formular schickt den Code per POST an /api/zinken/tor
 * (geht ohne JavaScript, auch im Browser der Quest). Dynamisch: die Seite liest die Env zur
 * Anfragezeit (Tor zu = »Probelauf gerade nicht aktiv«) und wird nie gecacht. noindex.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TorSeite({ params, searchParams }: Props): Promise<ReactElement> {
  const { locale } = await params;
  const sprache = locale === "en" ? "en" : "de";
  const { tor } = await searchParams;
  const t = await getTranslations({ locale: sprache, namespace: "werkbank.tor" });
  const zu = torKonfig(process.env) === null;

  return (
    <main data-testid="tor-feld" className="cc-page" style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem 3rem" }}>
      <h1 className="cc-display" style={{ margin: "0 0 0.75rem" }}>
        {t("titel")}
      </h1>
      {zu ? <p role="status">{t("zu")}</p> : null}
      {!zu && tor === "falsch" ? <p role="alert">{t("falsch")}</p> : null}
      <p className="cc-lead">{t("erklaerung")}</p>
      <form method="post" action="/api/zinken/tor" style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
        <input type="hidden" name="sprache" value={sprache} />
        <label htmlFor="tor-code">{t("feld")}</label>
        <input
          id="tor-code"
          name="code"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          required
        />
        <button type="submit">{t("knopf")}</button>
      </form>
    </main>
  );
}
